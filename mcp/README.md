# bioenergy-mcp

MCP (Model Context Protocol) server for the bioenergy.org API.

This service exposes dataset-related API endpoints as MCP tools, allowing MCP-compatible clients (e.g., Claude Desktop, MCP Inspector) to query datasets through a standardized interface.

## Purpose

This is a thin adapter layer over the existing bioenergy.org API.

- No business logic should live here
- All data and validation come from the API
- This service only translates MCP tool calls into HTTP requests

## Architecture
- Runs as a separate Docker container
- Communicates with the API over the internal Docker network
- Uses Streamable HTTP transport (remote MCP server)
- Exposes a single endpoint:

```
POST /mcp
```

Health check:

```
GET /health
```

## Available Tools

### get_dataset

Fetch a dataset by UID.

Maps to:

```
GET /api/datasets/:uid
```

### list_datasets

List datasets with pagination.

Maps to:

```
GET /api/datasets?limit=&offset=
```

### search_datasets

Search datasets by free text.

Maps to:

```
GET /api/datasets?page=&rows=&q=
```

## Environment Variables

These are required for the MCP service:

```
PORT=8081
API_BASE_URL=http://localhost:8080
API_TOKEN=
```

Notes:

- `API_TOKEN` is optional unless the API requires authentication (possible future addition)

## Running Locally

From the project root:

Build services:

```
docker compose build
```

Start all services:

```
docker compose up
```

Run in background:

```
docker compose up -d
```

View MCP logs:

```
docker compose logs -f mcp
```

## Testing

Health check:

```
curl http://localhost:8081/health
```

MCP endpoint:

```
http://localhost:8081/mcp
```

## Basic MCP test (initialize)

```
curl http://localhost:8081/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0"
      }
    }
  }'
```

## List tools

```
curl http://localhost:8081/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'
```

## Call a tool

```
curl http://localhost:8081/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "list_datasets",
      "arguments": {
        "limit": 5,
        "offset": 0
      }
    }
  }'
```

## Development Notes

- This service should remain stateless
- Do not import internal API models or business logic
- Always interact with the API via HTTP
- Keep tool interfaces simple and stable

## Potential Future Improvements

- Add search/filter tools
- Add write operations (create/update/delete) with proper auth
- Add request logging and rate limiting
- Add MCP resources (`dataset://{uid}`)
