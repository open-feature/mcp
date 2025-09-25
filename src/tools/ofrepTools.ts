import { z } from "zod";
import type { RegisterToolWithErrorHandling } from "../server.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";

const OFREPArgsSchema = z.object({
  base_url: z
    .string()
    .url()
    .optional()
    .describe(
      "Base URL of your OFREP-compatible flag service. Must be set directly or via environment variables or config file."
    ),
  flag_key: z
    .string()
    .optional()
    .describe(
      "If provided, calls single flag evaluation, otherwise performs bulk evaluation."
    ),
  context: z
    .object({
      targetingKey: z
        .string()
        .optional()
        .describe(
          "A string logically identifying the subject of evaluation (end-user, service, etc). Should be set in the majority of cases."
        ),
    })
    .passthrough()
    .optional()
    .describe("Context information for flag evaluation"),
  etag: z.string().optional().describe("ETag for bulk evaluation"),
  auth: z
    .object({
      bearer_token: z.string().min(1).optional(),
      api_key: z.string().min(1).optional(),
    })
    .optional(),
});
type OFREPArgs = z.infer<typeof OFREPArgsSchema>;

const OFREPConfigSchema = z
  .object({
    baseUrl: z.string().min(1),
    bearerToken: z.string().optional(),
    apiKey: z.string().optional(),
  })
  .refine((data) => data.bearerToken || data.apiKey, {
    message: "At least one of bearerToken or apiKey must be provided",
    path: ["bearerToken"],
  });

const ConfigFileSchema = z.object({
  OFREP: OFREPConfigSchema,
});
type OFREPConfig = z.infer<typeof OFREPConfigSchema>;

async function readConfigFromFile() {
  try {
    const explicitPath = process.env.OPENFEATURE_MCP_CONFIG_PATH;
    const defaultPath = resolve(homedir(), ".openfeature-mcp.json");
    const path =
      explicitPath && explicitPath.length > 0 ? explicitPath : defaultPath;
    const file = await readFile(path, { encoding: "utf-8" });

    const { OFREP } = ConfigFileSchema.parse(JSON.parse(file));
    return OFREP;
  } catch {
    return null;
  }
}

async function resolveConfig(args: OFREPArgs) {
  const envBase =
    process.env.OPENFEATURE_OFREP_BASE_URL ?? process.env.OFREP_BASE_URL;
  const envBearer =
    process.env.OPENFEATURE_OFREP_BEARER_TOKEN ??
    process.env.OFREP_BEARER_TOKEN;
  const envApiKey =
    process.env.OPENFEATURE_OFREP_API_KEY ?? process.env.OFREP_API_KEY;

  const fileCfg = await readConfigFromFile();

  const baseUrl = args.base_url ?? envBase ?? fileCfg?.baseUrl;
  const bearerToken =
    args.auth?.bearer_token ?? envBearer ?? fileCfg?.bearerToken;
  const apiKey = args.auth?.api_key ?? envApiKey ?? fileCfg?.apiKey;

  return OFREPConfigSchema.parse({ baseUrl, bearerToken, apiKey });
}

/**
 * Calls the OFREP API with the given configuration and arguments.
 */
async function callOFREPApi(
  cfg: OFREPConfig,
  parsed: OFREPArgs
): Promise<CallToolResult> {
  const base = cfg.baseUrl.replace(/\/$/, "");
  const isSingleFlagEval =
    typeof parsed.flag_key === "string" && parsed.flag_key.length > 0;
  const url = isSingleFlagEval
    ? `${base}/ofrep/v1/evaluate/flags/${encodeURIComponent(
        parsed.flag_key as string
      )}`
    : `${base}/ofrep/v1/evaluate/flags`;

  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
  };

  if (cfg.bearerToken) {
    headers["authorization"] = `Bearer ${cfg.bearerToken}`;
  } else if (cfg.apiKey) {
    headers["X-API-Key"] = cfg.apiKey;
  }
  if (!isSingleFlagEval && parsed.etag) {
    headers["If-None-Match"] = parsed.etag;
  }

  const body = JSON.stringify({
    context: parsed.context ?? {},
  });

  try {
    console.error(`Fetching OFREP API, url: ${url}, body: ${body}`);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    const etag =
      response.headers.get("ETag") ??
      response.headers.get("Etag") ??
      response.headers.get("etag") ??
      undefined;

    console.error(`OFREP API response, status: ${response.status}`);
    if (response.status === 304) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: 304,
              etag,
              message: "Bulk evaluation not modified",
            }),
          },
        ],
      };
    }

    // Read body once as text, then safely attempt JSON parse
    const rawText = await response.text().catch(() => undefined);
    let dataJSON: unknown = undefined;
    if (typeof rawText === "string" && rawText.length > 0) {
      try {
        dataJSON = JSON.parse(rawText);
      } catch {
        // not JSON; keep raw text
      }
    }

    if (!response.ok) {
      const errorMessage = dataJSON ?? rawText;
      const errorData = {
        status: response.status,
        error: errorMessage,
      };
      const errorJSON = JSON.stringify(errorData);
      console.error(
        `OFREP API error, status: ${response.status}, error: ${errorJSON}`
      );
      return {
        content: [{ type: "text", text: errorJSON }],
      };
    }

    if (!dataJSON) {
      throw new Error("No JSON data returned from OFREP API");
    }

    const responseData = isSingleFlagEval
      ? { status: response.status, data: dataJSON }
      : { status: response.status, etag, data: dataJSON };

    console.error(`OFREP API success, status: ${response.status}`);
    return {
      content: [{ type: "text", text: JSON.stringify(responseData) }],
    };
  } catch (err) {
    const errMsg = { error: err instanceof Error ? err.message : String(err) };
    const jsonErrMsg = JSON.stringify(errMsg);
    console.error(`OFREP API error, error: ${jsonErrMsg}`);
    return { content: [{ type: "text", text: jsonErrMsg }] };
  }
}

export function registerOFREPTools(
  registerToolWithErrorHandling: RegisterToolWithErrorHandling
): void {
  registerToolWithErrorHandling(
    "ofrep_flag_eval",
    {
      description: [
        "Evaluate feature flags using OpenFeature Remote Evaluation Protocol (OFREP).",
        "If flag_key is omitted, performs bulk evaluation.",
      ].join("\n"),
      inputSchema: OFREPArgsSchema.shape,
    },
    async (args: unknown): Promise<CallToolResult> => {
      const parsed = OFREPArgsSchema.parse(args);

      const cfg = await resolveConfig(parsed);
      return await callOFREPApi(cfg, parsed);
    }
  );
}
