# Microservice Documentation MCP Server

Model Context Protocol server for the Microservice Documentation Platform API.

## Installation

```bash
cd mcp-server
npm install
```

## Usage

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "microservice-docs": {
      "command": "node",
      "args": ["/path/to/microservice-docs/mcp-server/index.js"],
      "env": {
        "DOCS_API_BASE": "http://localhost:3001/api"
      }
    }
  }
}
```

### Available Tools

1. **create_tenant** - Create new tenant and get API key
2. **add_credentials** - Add service credentials
3. **get_credentials** - List all credentials
4. **create_page** - Create documentation page
5. **get_pages** - List all documentation pages
6. **get_files** - List uploaded files

### Example Usage in Claude

```
Create a tenant for "MyCompany" with domain "mycompany.com"
```

```
Add production credentials for "user-service" with username "admin", password "secret123", and endpoint "https://api.mycompany.com/users"
```

```
Create a documentation page titled "User Service API" in the "services" category with content about the API endpoints
```

## Environment Variables

- `DOCS_API_BASE` - API base URL (default: http://localhost:3001/api)
