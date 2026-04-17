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

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}
});

const mcpServer = new McpServer({
  name: "bioenergy-datasets",
  version: "0.1.0"
});

mcpServer.tool(
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
      return {
        content: [
          {
            type: "text",
            text: `Error fetching dataset ${uid}: ${err.message}`
          }
        ],
        isError: true
      };
    }
  }
);

mcpServer.tool(
  "list_datasets",
  {
    limit: z.number().int().min(1).max(100).default(25),
    offset: z.number().int().min(0).default(0)
  },
  async ({ limit, offset }) => {
    try {
      const response = await api.get("/api/datasets", {
        params: { limit, offset }
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
      return {
        content: [
          {
            type: "text",
            text: `Error listing datasets: ${err.message}`
          }
        ],
        isError: true
      };
    }
  }
);

mcpServer.tool(
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
      return {
        content: [
          {
            type: "text",
            text: `Error searching datasets: ${err.message}`
          }
        ],
        isError: true
      };
    }
  }
);

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  res.on("close", () => {
    transport.close();
  });

  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Explicitly reject GET (SSE probe) with 405 instead of 404
app.get("/mcp", (req, res) => {
  res.status(405).send("Method Not Allowed");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`MCP server listening on port ${PORT}`);
});
