import express from "express";
import axios from "axios";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const MCP_SERVER_NAME = "bioenergy-datasets";
const MCP_SERVER_VERSION = "0.2.0";

const PORT = Number(process.env.PORT || 8081);
const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN || "";

const SESSION_TTL_MS = 30 * 60 * 1000;
const SESSION_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// JSON-RPC 2.0 standard error codes
const JSONRPC_ERROR = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
};

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is required");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}
});

// Stores the last dataset list/search parameters for each MCP session.
// Pagination tools use this to fetch next/previous/current pages without
// requiring the client to resend the original query and filters.
const datasetSearchSessions = new Map();

// Resolve the MCP session ID used to isolate pagination state.
function getSessionKey(extra, getActiveSessionId) {
  return extra?.sessionId || getActiveSessionId() || null;
}

function saveDatasetSearchSession(sessionKey, state) {
  if (!sessionKey) return;
  datasetSearchSessions.set(sessionKey, state);
}

function getDatasetSearchSession(sessionKey) {
  return datasetSearchSessions.get(sessionKey);
}

function formatError(prefix, err) {
  const message =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Unknown error";

  return {
    content: [
      {
        type: "text",
        text: `${prefix}: ${message}`
      }
    ],
    isError: true
  };
}

function formatNoSearchSessionError() {
  return {
    content: [
      {
        type: "text",
        text: "No previous dataset list or search is available in this MCP session. Run list_datasets or search_datasets first."
      }
    ],
    isError: true
  };
}

async function fetchDatasetPage(params) {
  const response = await api.get("/api/datasets", { params });
  const data = response.data;

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2)
      }
    ],
    structuredContent: data
  };
}

// Each Streamable HTTP session gets its own McpServer instance.
// getActiveSessionId lets tool handlers resolve the transport session ID even
// when the SDK tool-call context does not expose extra.sessionId.
function createServer(getActiveSessionId = () => null) {
  const server = new McpServer(
    {
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION
    },
    {
      instructions:
        "Use list_datasets to browse datasets when no search term is provided. " +
        "Use search_datasets for free-text lookup by keyword. " +
        "Use next_dataset_page, previous_dataset_page, and current_dataset_page to navigate the most recent list or search results in this MCP session. " +
        "Use get_dataset only when you already know the dataset UID. " +
        "Page numbers are 1-based. Rows controls page size."
    }
  );

  server.tool(
    "get_dataset",
    "Fetch a single dataset by its exact uid field. Do not use the id field from search results.",
    {
      uid: z
        .string()
        .min(1)
        .describe("Exact dataset uid field from a dataset record, not the search result id field. Example: JBEI_https://doi.org/10.1016/j.jil.2025.100184")
    },
    async ({ uid }) => {
      try {
        const response = await api.get(`/api/datasets/${encodeURIComponent(uid)}`);
        const data = response.data;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2)
            }
          ],
          structuredContent: data
        };
      } catch (err) {
        return formatError(`Error fetching dataset ${uid}`, err);
      }
    }
  );

  server.tool(
    "list_datasets",
    "List datasets without a search query. Use this to browse the catalog page by page.",
    {
      page: z
        .number()
        .int()
        .min(1)
        .default(1)
        .describe("1-based page number. Use page 1 for the first page."),
      rows: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(50)
        .describe("Number of datasets to return per page, between 1 and 100.")
    },
    async ({ page, rows }, extra) => {
      try {
        const params = { page, rows };
        const result = await fetchDatasetPage(params);

        saveDatasetSearchSession(getSessionKey(extra, getActiveSessionId), {
          tool: "list_datasets",
          params
        });

        return result;
      } catch (err) {
        return formatError("Error listing datasets", err);
      }
    }
  );

  server.tool(
    "search_datasets",
    "Search datasets by free-text query and optional metadata filters. Use this to find datasets by keyword, publication date, analysis type, BRC, and other supported filter fields.",
    {
      q: z
        .string()
        .default("")
        .describe("Optional free-text search query. Use an empty string to search only by filters."),
      page: z
        .number()
        .int()
        .min(1)
        .default(1)
        .describe("1-based page number."),
      rows: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(50)
        .describe("Number of results per page, between 1 and 100."),
      analysisType: z
        .string()
        .optional()
        .describe('Optional analysisType filter, for example "not specified" or "shotgun_proteomics".'),
      brc: z
        .array(z.string())
        .optional()
        .describe('Optional list of BRC filters, for example ["JBEI"] or ["JBEI", "CABBI"]. The complete set of BRCs are: ["JBEI", "CABBI", "CBI", "GLBRC"].'),
      from_date: z
        .string()
        .optional()
        .describe("Optional publication date lower bound in YYYY-MM-DD format. Includes datasets published on or after this date."),
      until_date: z
        .string()
        .optional()
        .describe("Optional publication date upper bound in YYYY-MM-DD format. Includes datasets published on or before this date.")
    },
    async ({ q, page, rows, analysisType, brc, from_date, until_date }, extra) => {
      try {
        const params = {
          q,
          page,
          rows
        };

        if (analysisType) {
          params["filters[analysisType]"] = analysisType;
        }

        if (brc?.length) {
          brc.forEach((value, index) => {
            params[`filters[brc][${index}]`] = value;
          });
        }

        if (from_date) {
          params.from_date = from_date;
        }

        if (until_date) {
          params.until_date = until_date;
        }

        const result = await fetchDatasetPage(params);

        saveDatasetSearchSession(getSessionKey(extra, getActiveSessionId), {
          tool: "search_datasets",
          params
        });

        return result;
      } catch (err) {
        return formatError("Error searching datasets", err);
      }
    }
  );

  server.tool(
    "next_dataset_page",
    "Return the next page of the most recent dataset list or search in this MCP session.",
    {},
    async (_args, extra) => {
      try {
        const sessionKey = getSessionKey(extra, getActiveSessionId);
        const state = getDatasetSearchSession(sessionKey);

        if (!state) {
          return formatNoSearchSessionError();
        }

        const params = {
          ...state.params,
          page: Number(state.params.page || 1) + 1
        };

        const result = await fetchDatasetPage(params);

        saveDatasetSearchSession(sessionKey, {
          ...state,
          params
        });

        return result;
      } catch (err) {
        return formatError("Error fetching next dataset page", err);
      }
    }
  );

  server.tool(
    "previous_dataset_page",
    "Return the previous page of the most recent dataset list or search in this MCP session.",
    {},
    async (_args, extra) => {
      try {
        const sessionKey = getSessionKey(extra, getActiveSessionId);
        const state = getDatasetSearchSession(sessionKey);

        if (!state) {
          return formatNoSearchSessionError();
        }

        const params = {
          ...state.params,
          page: Math.max(Number(state.params.page || 1) - 1, 1)
        };

        const result = await fetchDatasetPage(params);

        saveDatasetSearchSession(sessionKey, {
          ...state,
          params
        });

        return result;
      } catch (err) {
        return formatError("Error fetching previous dataset page", err);
      }
    }
  );

  server.tool(
    "current_dataset_page",
    "Return the current page of the most recent dataset list or search in this MCP session.",
    {},
    async (_args, extra) => {
      try {
        const sessionKey = getSessionKey(extra, getActiveSessionId);
        const state = getDatasetSearchSession(sessionKey);

        if (!state) {
          return formatNoSearchSessionError();
        }

        return await fetchDatasetPage(state.params);
      } catch (err) {
        return formatError("Error fetching current dataset page", err);
      }
    }
  );

  return server;
}

const app = express();
app.use(express.json());

// Streamable HTTP sessions require the initialized transport to be reused
// across POST/GET requests. Key transports by MCP session ID so pagination
// state and MCP session state remain isolated per client.
const transports = new Map();

app.all("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];
  let transport;
  let server;
  const session = { id: null };

  try {
    if (sessionId && transports.has(sessionId)) {
      const entry = transports.get(sessionId);
      entry.lastAccessed = Date.now();
      ({ transport, server } = entry);
    } else if (req.method === "POST" && !sessionId) {
      server = createServer(() => session.id);

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          session.id = newSessionId;
          transports.set(newSessionId, {
            transport,
            server,
            session,
            lastAccessed: Date.now()
          });
        }
      });

      // Clean up both transport state and pagination state when the MCP session ends.
      transport.onclose = () => {
        if (transport.sessionId) {
          transports.delete(transport.sessionId);
          datasetSearchSessions.delete(transport.sessionId);
        }

        // Do not call server.close() here. Closing the server can trigger transport
        // closure again in some clients (i.e. Codex), causing recursive onclose handling
        // and resulting in RangeError: Maximum call stack size exceeded.
      };

      await server.connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: JSONRPC_ERROR.INVALID_REQUEST,
          message: "Bad Request: No valid MCP session"
        },
        id: req.body?.id ?? null
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request failed:", err);

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: JSONRPC_ERROR.INTERNAL_ERROR,
          message: "Internal server error"
        },
        id: req.body?.id ?? null
      });
    }
  }
});

// Clean up abandoned MCP sessions in case a client disconnects without sending DELETE.
setInterval(() => {
  const now = Date.now();

  for (const [sessionId, entry] of transports.entries()) {
    if (now - entry.lastAccessed > SESSION_TTL_MS) {
      transports.delete(sessionId);
      datasetSearchSessions.delete(sessionId);

      try {
        entry.transport.close();
      } catch {}
    }
  }
}, SESSION_CLEANUP_INTERVAL_MS).unref();

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`MCP server listening on port ${PORT}`);
});
