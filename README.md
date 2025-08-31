# DocForge

**Where Great Documentation is Forged**

DocForge is an AI-first documentation platform designed for the modern development workflow. Built for teams who use AI extensively and need a seamless way to store, organize, and share their AI-generated insights, prompts, and documentation.

![DocForge Dashboard](https://github.com/subnanih/DocForge/blob/main/Screenshots/Screenshot%202025-08-31%20at%207.25.12%E2%80%AFPM.png)

## 🤖 Why DocForge?

As AI becomes integral to development workflows, the gap between AI-generated content and documentation grows. DocForge bridges this gap by allowing AI to directly create, update, and manage documentation, eliminating manual copy-paste workflows.

### Key Features
- **AI-First Architecture** - Direct AI integration via MCP (Model Context Protocol)
- **Multi-Tenant Platform** - Isolated spaces for different organizations
- **Custom Domains** - Professional subdomains with SSL certificates
- **Advanced Security** - Password protection and session management
- **Professional Branding** - Custom logos, colors, and CSS
- **Markdown Editor** - Live preview with syntax highlighting
- **RESTful APIs** - Complete programmatic access

![Documentation Interface](https://github.com/subnanih/DocForge/blob/main/Screenshots/Screenshot%202025-08-31%20at%207.26.19%E2%80%AFPM.png)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/subnanih/DocForge.git
cd DocForge
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your MongoDB connection and other settings
```

4. **Initialize the database**
```bash
npm run setup
```

5. **Start the application**
```bash
npm start
```

The application will be available at:
- **API Server**: http://localhost:3001
- **Frontend**: http://localhost:3000

![Editor Interface](https://github.com/subnanih/DocForge/blob/main/Screenshots/Screenshot%202025-08-31%20at%207.28.29%E2%80%AFPM.png)

## 🔧 Configuration

### Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/docforge

# JWT Secret
JWT_SECRET=your-secret-key

# Server Ports
API_PORT=3001
FRONTEND_PORT=3000

# Domain Configuration
BASE_DOMAIN=docforge.com
```

### Custom Domain Setup
1. Add DNS A record: `*.yourdomain.com` → Your server IP
2. Configure SSL certificate for wildcard domain
3. Update `BASE_DOMAIN` in environment variables

![Custom Domains](https://github.com/subnanih/DocForge/blob/main/Screenshots/Screenshot%202025-08-31%20at%207.28.35%E2%80%AFPM.png)

## 🤖 MCP Integration

DocForge includes a Model Context Protocol (MCP) server for direct AI integration.

### Starting MCP Server
```bash
cd mcp-server
npm install
npm start
```

The MCP server runs on port 3002 and provides these functions:
- `get_tenant_info(apiKey)` - Get organization details
- `get_pages(apiKey)` - List all documentation pages
- `create_page(apiKey, title, content, category, tags)` - Create new page
- `update_page(apiKey, pageId, content)` - Update existing page
- `delete_page(apiKey, pageId)` - Delete page
- `get_credentials(apiKey)` - Manage API credentials

### AI Integration Example
```javascript
// AI can directly create documentation
const response = await mcp.create_page({
  apiKey: "your-api-key",
  title: "AI Test Results",
  content: "# Test Results\n\nAI-generated analysis...",
  category: "testing",
  tags: ["ai", "automated", "results"]
});
```

![MCP Integration](https://github.com/subnanih/DocForge/blob/main/Screenshots/Screenshot%202025-08-31%20at%207.29.06%E2%80%AFPM.png)

## 📚 Usage

### Creating Organizations
1. Access the admin panel at `/admin`
2. Create new tenant organizations
3. Configure custom subdomains and branding
4. Set up password protection if needed

### Managing Documentation
1. Use the web interface at your subdomain
2. Create pages with the markdown editor
3. Organize with categories and tags
4. Upload files and images

### API Access
```bash
# Get all pages
curl -X GET https://your-domain.com/api/pages \
  -H "X-API-Key: your-api-key"

# Create new page
curl -X POST https://your-domain.com/api/pages \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Page",
    "content": "# Hello World",
    "category": "general"
  }'
```

![API Documentation](https://github.com/subnanih/DocForge/blob/main/Screenshots/Screenshot%202025-08-31%20at%207.29.35%E2%80%AFPM.png)

## 🎨 Customization

### Custom Branding
- Upload custom logos
- Configure color schemes
- Add custom CSS with interactive examples
- Set custom favicons

### CSS Examples
DocForge includes interactive CSS examples for common customizations:
- Navigation styling
- Card layouts
- Color schemes
- Typography
- Animations

![Customization Options](https://github.com/subnanih/DocForge/blob/main/Screenshots/Screenshot%202025-08-31%20at%207.44.00%E2%80%AFPM.png)

## 🔒 Security Features

- **Multi-tenant isolation** - Complete data separation
- **Password protection** - Subdomain-level security
- **Session management** - Secure authentication
- **API key authentication** - Programmatic access control
- **HTTPS enforcement** - SSL/TLS encryption

## 🚀 Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### PM2 Production
```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start api/server.js --name docforge-api
pm2 start frontend/server.js --name docforge-frontend
pm2 save
```

### Environment Setup
- Configure MongoDB Atlas for cloud database
- Set up SSL certificates for custom domains
- Configure environment variables for production

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Run with nodemon for auto-restart
```

### Areas for Contribution
- Frontend improvements (React, Vue, or vanilla JS)
- Backend features (Node.js, Express, MongoDB)
- UI/UX design enhancements
- Documentation and guides
- Testing and quality assurance
- DevOps and deployment automation

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: https://docforge.com
- **Documentation**: Complete setup guides included
- **Issues**: Report bugs and request features
- **Discussions**: Join community conversations

---

**Built with ❤️ for the AI development community**

*DocForge - Where AI and documentation work together seamlessly*
