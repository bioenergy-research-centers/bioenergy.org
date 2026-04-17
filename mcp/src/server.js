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
  const server = new McpServer(
    {
      name: "bioenergy-datasets",
      version: "0.1.0"
    },
    {
      instructions:
        "Use list_datasets to browse datasets when no search term is provided. " +
        "Use search_datasets for free-text lookup by keyword. " +
        "Use get_dataset only when you already know the dataset UID. " +
        "Page numbers are 1-based. Rows controls page size."
    }
  );

  server.tool(
    "get_dataset",
    "Fetch a single dataset by its exact dataset UID. Use this only when you already know the UID.",
    {
      uid: z
        .string()
        .min(1)
        .describe("Exact dataset UID, for example a known dataset identifier from a previous result.")
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
    async ({ page, rows }) => {
      try {
        const response = await api.get("/api/datasets", {
          params: { page, rows }
        });
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
        return formatError("Error listing datasets", err);
      }
    }
  );

  server.tool(
    "search_datasets",
    "Search datasets by free-text keyword. Use this when the user provides a topic, term, or phrase such as 'protein' or 'switchgrass'.",
    {
      q: z
        .string()
        .min(1)
        .describe("Free-text search query. Example values: 'protein', 'biomass', 'switchgrass'."),
      page: z
        .number()
        .int()
        .min(1)
        .default(1)
        .describe("1-based page number for paginated search results."),
      rows: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(50)
        .describe("Number of search results to return per page, between 1 and 100.")
    },
    async ({ q, page, rows }) => {
      try {
        const response = await api.get("/api/datasets", {
          params: { q, page, rows }
        });
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

app.get("/mcp", (req, res) => {
  res.status(405).send("Method Not Allowed");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`MCP server listening on port ${PORT}`);
});
