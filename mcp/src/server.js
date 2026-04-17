import express from "express";
import axios from "axios";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const PORT = Number(process.env.PORT || 8081);
const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN || "";

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is required");
}

// Shared HTTP client is fine because it is stateless
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}
});

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

function createServer() {
  const server = new McpServer({
    name: "bioenergy-datasets",
    version: "0.1.0"
  });

  server.tool(
    "get_dataset",
    {
      uid: z.string().describe("Dataset UID")
    },
    async ({ uid }) => {
      try {
        const response = await api.get(`/api/datasets/${encodeURIComponent(uid)}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2)
            }
          ]
        };
      } catch (err) {
        return formatError(`Error fetching dataset ${uid}`, err);
      }
    }
  );

  server.tool(
    "list_datasets",
    {
      page: z.number().int().min(1).default(1).describe("Page number"),
      rows: z.number().int().min(1).max(100).default(50).describe("Rows per page")
    },
    async ({ page, rows }) => {
      try {
        const response = await api.get("/api/datasets", {
          params: { page, rows }
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2)
            }
          ]
        };
      } catch (err) {
        return formatError("Error listing datasets", err);
      }
    }
  );

  server.tool(
    "search_datasets",
    {
      q: z.string().min(1).describe("Free-text search query"),
      page: z.number().int().min(1).default(1).describe("Page number"),
      rows: z.number().int().min(1).max(100).default(50).describe("Rows per page")
    },
    async ({ q, page, rows }) => {
      try {
        const response = await api.get("/api/datasets", {
          params: { q, page, rows }
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2)
            }
          ]
        };
      } catch (err) {
        return formatError("Error searching datasets", err);
      }
    }
  );

  return server;
}

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  let cleanedUp = false;

  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;

    try {
      await transport.close();
    } catch {}

    try {
      await server.close();
    } catch {}
  };

  res.on("close", () => {
    void cleanup();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request failed:", err);

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error"
        },
        id: req.body?.id ?? null
      });
    }
  } finally {
    void cleanup();
  }
});

// Explicitly reject GET (legacy SSE probe) with 405
app.get("/mcp", (req, res) => {
  res.status(405).send("Method Not Allowed");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`MCP server listening on port ${PORT}`);
});
