#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = "http://localhost:3001/api";

class MicroserviceDocsServer {
  constructor() {
    this.server = new Server(
      {
        name: "microservice-docs",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "create_tenant",
            description: "Create a new tenant organization",
            inputSchema: {
              type: "object",
              properties: {
                name: { type: "string", description: "Organization name" },
                domain: { type: "string", description: "Organization domain" }
              },
              required: ["name", "domain"]
            }
          },
          {
            name: "create_page",
            description: "Create a new documentation page",
            inputSchema: {
              type: "object",
              properties: {
                apiKey: { type: "string", description: "Tenant API key" },
                title: { type: "string", description: "Page title" },
                slug: { type: "string", description: "URL slug for the page" },
                content: { type: "string", description: "Markdown content" },
                category: { type: "string", description: "Page category" },
                tags: { type: "array", items: { type: "string" }, description: "Page tags" },
                weight: { type: "number", description: "Page weight for ordering" }
              },
              required: ["apiKey", "title", "slug", "content", "category"]
            }
          },
          {
            name: "get_pages",
            description: "Get all documentation pages for a tenant",
            inputSchema: {
              type: "object",
              properties: {
                apiKey: { type: "string", description: "Tenant API key" }
              },
              required: ["apiKey"]
            }
          },
          {
            name: "add_credentials",
            description: "Add new credentials for a service",
            inputSchema: {
              type: "object",
              properties: {
                apiKey: { type: "string", description: "Tenant API key" },
                environment: { type: "string", description: "Environment (dev, staging, prod)" },
                serviceName: { type: "string", description: "Name of the service" },
                credentialType: { type: "string", description: "Type of credential (username-password, api-key, oauth)" },
                credentials: {
                  type: "object",
                  description: "Credential data",
                  properties: {
                    username: { type: "string", description: "Username (for username-password type)" },
                    email: { type: "string", description: "Email (for username-password type)" },
                    password: { type: "string", description: "Password (for username-password type)" },
                    apiKey: { type: "string", description: "API key (for api-key type)" },
                    endpoint: { type: "string", description: "Service endpoint URL" }
                  }
                }
              },
              required: ["apiKey", "environment", "serviceName", "credentialType", "credentials"]
            }
          },
          {
            name: "get_credentials",
            description: "Get all credentials for a tenant",
            inputSchema: {
              type: "object",
              properties: {
                apiKey: { type: "string", description: "Tenant API key" }
              },
              required: ["apiKey"]
            }
          },
          {
            name: "update_page",
            description: "Update an existing documentation page",
            inputSchema: {
              type: "object",
              properties: {
                apiKey: { type: "string", description: "Tenant API key" },
                pageId: { type: "string", description: "Page ID to update" },
                title: { type: "string", description: "Page title" },
                content: { type: "string", description: "Markdown content" },
                category: { type: "string", description: "Page category" },
                tags: { type: "array", items: { type: "string" }, description: "Page tags" },
                weight: { type: "number", description: "Page weight for ordering" }
              },
              required: ["apiKey", "pageId"]
            }
          },
          {
            name: "delete_page",
            description: "Delete a documentation page",
            inputSchema: {
              type: "object",
              properties: {
                apiKey: { type: "string", description: "Tenant API key" },
                pageId: { type: "string", description: "Page ID to delete" }
              },
              required: ["apiKey", "pageId"]
            }
          },
          {
            name: "update_credentials",
            description: "Update existing credentials",
            inputSchema: {
              type: "object",
              properties: {
                apiKey: { type: "string", description: "Tenant API key" },
                credentialId: { type: "string", description: "Credential ID to update" },
                environment: { type: "string", description: "Environment (dev, staging, prod)" },
                serviceName: { type: "string", description: "Name of the service" },
                credentialType: { type: "string", description: "Type of credential" },
                credentials: { type: "object", description: "Credential data" }
              },
              required: ["apiKey", "credentialId"]
            }
          },
          {
            name: "delete_credentials",
            description: "Delete credentials",
            inputSchema: {
              type: "object",
              properties: {
                apiKey: { type: "string", description: "Tenant API key" },
                credentialId: { type: "string", description: "Credential ID to delete" }
              },
              required: ["apiKey", "credentialId"]
            }
          },
          {
            name: "get_tenant_info",
            description: "Get current tenant information",
            inputSchema: {
              type: "object",
              properties: {
                apiKey: { type: "string", description: "Tenant API key" }
              },
              required: ["apiKey"]
            }
          },
          {
            name: "upload_file",
            description: "Upload a file for documentation",
            inputSchema: {
              type: "object",
              properties: {
                apiKey: { type: "string", description: "Tenant API key" },
                filePath: { type: "string", description: "Local file path to upload" }
              },
              required: ["apiKey", "filePath"]
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "create_tenant":
            return await this.createTenant(args);
          case "create_page":
            return await this.createPage(args);
          case "get_pages":
            return await this.getPages(args);
          case "add_credentials":
            return await this.addCredentials(args);
          case "get_credentials":
            return await this.getCredentials(args);
          case "update_page":
            return await this.updatePage(args);
          case "delete_page":
            return await this.deletePage(args);
          case "update_credentials":
            return await this.updateCredentials(args);
          case "delete_credentials":
            return await this.deleteCredentials(args);
          case "get_tenant_info":
            return await this.getTenantInfo(args);
          case "upload_file":
            return await this.uploadFile(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async createTenant(args) {
    try {
      const response = await fetch(`${API_BASE}/tenant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: args.name,
          domain: args.domain
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create tenant: ${error}`);
      }

      const result = await response.json();
      
      return {
        content: [{
          type: "text",
          text: `✅ Tenant created successfully!\n\n**Organization**: ${result.tenant.name}\n**Domain**: ${result.tenant.domain}\n**API Key**: \`${result.apiKey}\`\n\n🔑 **Important**: Save this API key securely - you'll need it for all future operations!`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error creating tenant: ${error.message}`
        }]
      };
    }
  }

  async createPage(args) {
    const { apiKey, ...pageData } = args;
    
    const response = await fetch(`${API_BASE}/pages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify(pageData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create page: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Documentation page created successfully!

**Title**: ${data.title}
**Category**: ${data.category}
**Weight**: ${data.weight}
**Tags**: ${data.tags ? data.tags.join(', ') : 'None'}
**Created**: ${new Date(data.createdAt).toLocaleString()}

The page is now available in the documentation sidebar and can be accessed via the web interface.`
        }
      ]
    };
  }

  async getPages(args) {
    const response = await fetch(`${API_BASE}/pages`, {
      headers: { "X-API-Key": args.apiKey }
    });

    if (!response.ok) {
      throw new Error(`Failed to get pages: ${response.statusText}`);
    }

    const pages = await response.json();
    
    if (pages.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "📚 No documentation pages found for this tenant."
          }
        ]
      };
    }

    const pagesList = pages.map(page => 
      `**${page.title}** (${page.category})
  Weight: ${page.weight}
  Tags: ${page.tags ? page.tags.join(', ') : 'None'}
  Updated: ${new Date(page.updatedAt).toLocaleString()}`
    ).join('\n\n');

    return {
      content: [
        {
          type: "text",
          text: `📚 Documentation Pages (${pages.length} total)

${pagesList}`
        }
      ]
    };
  }

  async addCredentials(args) {
    const { apiKey, ...credentialData } = args;
    
    const response = await fetch(`${API_BASE}/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify(credentialData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to add credentials: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: `🔐 Credentials added successfully!

**Service**: ${data.serviceName}
**Environment**: ${data.environment}
**Type**: ${data.credentialType}
**Added**: ${new Date(data.createdAt).toLocaleString()}

The credentials are now securely stored and available in the credentials management interface.`
        }
      ]
    };
  }

  async getCredentials(args) {
    const response = await fetch(`${API_BASE}/credentials`, {
      headers: { "X-API-Key": args.apiKey }
    });

    if (!response.ok) {
      throw new Error(`Failed to get credentials: ${response.statusText}`);
    }

    const credentials = await response.json();
    
    if (credentials.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "🔐 No credentials found for this tenant."
          }
        ]
      };
    }

    const credentialsList = credentials.map(cred => 
      `**${cred.serviceName}** (${cred.environment})
  Type: ${cred.credentialType}
  Updated: ${new Date(cred.updatedAt).toLocaleString()}`
    ).join('\n\n');

    return {
      content: [
        {
          type: "text",
          text: `🔐 Stored Credentials (${credentials.length} total)

${credentialsList}`
        }
      ]
    };
  }

  async updatePage(args) {
    const { apiKey, pageId, ...updateData } = args;
    
    const response = await fetch(`${API_BASE}/pages/${pageId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to update page: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Page updated successfully!

**Title**: ${data.title}
**Category**: ${data.category}
**Updated**: ${new Date(data.updatedAt).toLocaleString()}

The page changes are now live in the documentation.`
        }
      ]
    };
  }

  async deletePage(args) {
    const response = await fetch(`${API_BASE}/pages/${args.pageId}`, {
      method: "DELETE",
      headers: { "X-API-Key": args.apiKey }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to delete page: ${errorData.error || response.statusText}`);
    }

    return {
      content: [
        {
          type: "text",
          text: `🗑️ Page deleted successfully!

The page has been permanently removed from the documentation.`
        }
      ]
    };
  }

  async updateCredentials(args) {
    const { apiKey, credentialId, ...updateData } = args;
    
    const response = await fetch(`${API_BASE}/credentials/${credentialId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to update credentials: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: `🔐 Credentials updated successfully!

**Service**: ${data.serviceName}
**Environment**: ${data.environment}
**Updated**: ${new Date(data.updatedAt).toLocaleString()}

The credentials have been securely updated.`
        }
      ]
    };
  }

  async deleteCredentials(args) {
    const response = await fetch(`${API_BASE}/credentials/${args.credentialId}`, {
      method: "DELETE",
      headers: { "X-API-Key": args.apiKey }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to delete credentials: ${errorData.error || response.statusText}`);
    }

    return {
      content: [
        {
          type: "text",
          text: `🗑️ Credentials deleted successfully!

The credentials have been permanently removed from secure storage.`
        }
      ]
    };
  }

  async getTenantInfo(args) {
    const response = await fetch(`${API_BASE}/tenant/info`, {
      headers: { "X-API-Key": args.apiKey }
    });

    if (!response.ok) {
      throw new Error(`Failed to get tenant info: ${response.statusText}`);
    }

    const tenant = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: `🏢 Tenant Information

**Name**: ${tenant.name}
**Domain**: ${tenant.domain || 'Not specified'}
**Created**: ${new Date(tenant.createdAt).toLocaleString()}
**API Key**: ${args.apiKey.substring(0, 8)}...

This is your current tenant context for all operations.`
        }
      ]
    };
  }

  async uploadFile(args) {
    try {
      const fs = await import('fs');
      const FormData = await import('form-data');
      
      // Check if file exists
      if (!fs.existsSync(args.filePath)) {
        throw new Error(`File not found: ${args.filePath}`);
      }

      // Create form data
      const form = new FormData();
      form.append('file', fs.createReadStream(args.filePath));

      // Upload file
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          'X-API-Key': args.apiKey,
          ...form.getHeaders()
        },
        body: form
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      
      return {
        content: [
          {
            type: "text",
            text: `📎 File uploaded successfully!

**Original Name**: ${result.originalName}
**File Name**: ${result.filename}
**Size**: ${(result.size / 1024).toFixed(2)} KB
**URL**: ${result.url}

You can now reference this file in your documentation:
\`\`\`markdown
![${result.originalName}](${result.url})
\`\`\`

Or as a link:
\`\`\`markdown
[Download ${result.originalName}](${result.url})
\`\`\``
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Upload failed: ${error.message}

**Supported file types**: JPEG, PNG, GIF, SVG, PDF, DOC, DOCX
**Maximum size**: 10MB
**Usage**: Provide the full path to a local file`
          }
        ]
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Microservice Documentation MCP server running on stdio");
  }
}

const server = new MicroserviceDocsServer();
server.run().catch(console.error);
