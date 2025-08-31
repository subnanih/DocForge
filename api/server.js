const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../static/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(require('cookie-parser')());

// Create uploads directory
const uploadsDir = path.join(__dirname, '../static/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../static/uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/microservice-docs');

// Schemas
const TenantSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  domain: { type: String, required: true },
  apiKey: { type: String, required: true },
  customDomain: { type: String, default: null }, // docs.company.com
  subdomain: { type: String, default: null },    // company.docforge.com
  subdomainPassword: { type: String, default: null }, // Password for subdomain access
  domainVerified: { type: Boolean, default: false },
  domainSettings: {
    favicon: { type: String, default: null },
    customCSS: { type: String, default: null },
    logoUrl: { type: String, default: null },
    brandColor: { type: String, default: '#3B82F6' }
  },
  createdAt: { type: Date, default: Date.now }
});

const CredentialSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  environment: { type: String, required: true },
  serviceName: { type: String, required: true },
  credentials: {
    // Flexible credential fields
    id: String,
    username: String,
    email: String,
    mobile: String,
    password: String,
    apiKey: String,
    endpoint: String,
    accountId: String,
    region: String,
    // Additional custom fields
    customFields: { type: Map, of: String }
  },
  deploymentInfo: {
    provider: String,
    region: String,
    accountId: String,
    instanceId: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const FileSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  category: { type: String, default: 'general' },
  createdAt: { type: Date, default: Date.now }
});

const PageSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  tags: [String],
  weight: { type: Number, default: 999 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Tenant = mongoose.model('Tenant', TenantSchema);
const Credential = mongoose.model('Credential', CredentialSchema);
const File = mongoose.model('File', FileSchema);
const Page = mongoose.model('Page', PageSchema);

// Domain identification middleware
async function identifyTenantByDomain(req, res, next) {
  try {
    const host = req.get('host');
    let tenant = null;
    
    // Check for custom domain first
    tenant = await Tenant.findOne({ customDomain: host });
    
    // Check for subdomain (company.docforge.com)
    if (!tenant && host.includes('.docforge.com')) {
      const subdomain = host.split('.')[0];
      tenant = await Tenant.findOne({ subdomain: subdomain });
    }
    
    // Store tenant info for later use
    if (tenant) {
      req.domainTenant = tenant;
    }
    
    next();
  } catch (error) {
    console.error('Domain identification error:', error);
    next();
  }
}

// Apply domain middleware to all routes
app.use(identifyTenantByDomain);

// Middleware to verify API key
const verifyApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  const tenant = await Tenant.findOne({ apiKey });
  if (!tenant) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  req.tenant = tenant;
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'DocForge API',
    version: '1.0.0'
  });
});

// Routes
app.post('/api/tenant', async (req, res) => {
  try {
    const { name, domain } = req.body;
    const apiKey = require('crypto').randomBytes(32).toString('hex');
    
    const tenant = new Tenant({ name, domain, apiKey });
    await tenant.save();
    
    res.json({ tenant, apiKey });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/credentials', verifyApiKey, async (req, res) => {
  try {
    const credential = new Credential({
      tenantId: req.tenant._id,
      ...req.body,
      updatedAt: new Date()
    });
    await credential.save();
    res.json(credential);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/credentials', verifyApiKey, async (req, res) => {
  try {
    const credentials = await Credential.find({ tenantId: req.tenant._id });
    res.json(credentials);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/credentials/:id', verifyApiKey, async (req, res) => {
  try {
    const credential = await Credential.findOne({ 
      _id: req.params.id, 
      tenantId: req.tenant._id 
    });
    
    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }
    
    res.json(credential);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/credentials/:id', verifyApiKey, async (req, res) => {
  try {
    const credential = await Credential.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenant._id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json(credential);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete credential
app.delete('/api/credentials/:id', verifyApiKey, async (req, res) => {
  try {
    const credential = await Credential.findOneAndDelete({ 
      _id: req.params.id, 
      tenantId: req.tenant._id 
    });
    
    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }
    
    res.json({ message: 'Credential deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/documents', verifyApiKey, async (req, res) => {
  try {
    const document = new Document({
      tenantId: req.tenant._id,
      ...req.body,
      updatedAt: new Date()
    });
    await document.save();
    res.json(document);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/documents', verifyApiKey, async (req, res) => {
  try {
    const documents = await Document.find({ tenantId: req.tenant._id });
    res.json(documents);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// File routes
app.get('/api/files', verifyApiKey, async (req, res) => {
  try {
    const files = await File.find({ tenantId: req.tenant._id }).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/files/upload', verifyApiKey, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = new File({
      tenantId: req.tenant._id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      category: req.body.category || 'general'
    });

    await file.save();
    res.json(file);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Page routes
app.post('/api/pages', verifyApiKey, async (req, res) => {
  try {
    const page = new Page({
      tenantId: req.tenant._id,
      ...req.body,
      updatedAt: new Date()
    });
    await page.save();
    
    // Generate markdown file for Docusaurus
    const docsDir = path.join(__dirname, '../docs', req.body.category);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    const markdownContent = `---
sidebar_position: ${Date.now()}
tags: [${req.body.tags ? req.body.tags.join(', ') : ''}]
---

${req.body.content}`;
    
    fs.writeFileSync(path.join(docsDir, `${req.body.slug}.md`), markdownContent);
    
    res.json(page);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/pages', verifyApiKey, async (req, res) => {
  try {
    const pages = await Page.find({ tenantId: req.tenant._id }).sort({ createdAt: -1 });
    res.json(pages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update page
app.put('/api/pages/:id', verifyApiKey, async (req, res) => {
  try {
    const page = await Page.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenant._id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Update markdown file
    const docsDir = path.join(__dirname, '../docs', page.category);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    const markdownContent = `---
sidebar_position: ${page.weight || 999}
tags: [${page.tags ? page.tags.join(', ') : ''}]
---

${page.content}`;
    
    fs.writeFileSync(path.join(docsDir, `${page.slug}.md`), markdownContent);
    
    res.json(page);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete page
app.delete('/api/pages/:id', verifyApiKey, async (req, res) => {
  try {
    const page = await Page.findOneAndDelete({ 
      _id: req.params.id, 
      tenantId: req.tenant._id 
    });
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Delete markdown file
    const filePath = path.join(__dirname, '../docs', page.category, `${page.slug}.md`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get tenant info
app.get('/api/tenant/info', verifyApiKey, async (req, res) => {
  try {
    res.json({
      _id: req.tenant._id,
      name: req.tenant.name,
      domain: req.tenant.domain,
      customDomain: req.tenant.customDomain,
      subdomain: req.tenant.subdomain,
      domainVerified: req.tenant.domainVerified,
      domainSettings: req.tenant.domainSettings,
      createdAt: req.tenant.createdAt
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Debug: List all tenants (no auth required for debugging)
app.get('/api/debug/tenants', async (req, res) => {
  try {
    const tenants = await Tenant.find({}, 'name domain apiKey createdAt').sort({ createdAt: -1 });
    res.json(tenants);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Clear all data endpoint (development only)
app.post('/api/clear-all-data', async (req, res) => {
  try {
    await Tenant.deleteMany({});
    await Credential.deleteMany({});
    await Page.deleteMany({});
    await File.deleteMany({});
    res.json({ message: 'All data cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics endpoint
app.get('/api/analytics', verifyApiKey, async (req, res) => {
  try {
    const [pages, credentials] = await Promise.all([
      Page.find({ tenantId: req.tenant._id }),
      Credential.find({ tenantId: req.tenant._id })
    ]);

    const categories = [...new Set(pages.map(p => p.category))];
    const tags = [...new Set(pages.flatMap(p => p.tags || []))];
    
    const recentPages = pages
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
      .map(p => ({
        title: p.title,
        category: p.category,
        updatedAt: p.updatedAt
      }));

    res.json({
      pages: pages.length,
      credentials: credentials.length,
      comments: 0, // Placeholder for future comment system
      categories: categories.length,
      tags: tags.length,
      recentPages,
      categoryBreakdown: categories.map(cat => ({
        category: cat,
        count: pages.filter(p => p.category === cat).length
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tenant lookup by domain (for frontend routing)
app.post('/api/tenant/by-domain', async (req, res) => {
  try {
    const { domain, type } = req.body;
    let tenant = null;
    
    if (type === 'custom') {
      tenant = await Tenant.findOne({ customDomain: domain });
    } else if (type === 'subdomain') {
      tenant = await Tenant.findOne({ subdomain: domain });
    }
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json({
      _id: tenant._id,
      name: tenant.name,
      domain: tenant.domain,
      apiKey: tenant.apiKey,
      customDomain: tenant.customDomain,
      subdomain: tenant.subdomain,
      subdomainPassword: tenant.subdomainPassword, // Include for auth check
      domainVerified: tenant.domainVerified,
      domainSettings: tenant.domainSettings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Domain Management Routes
app.post('/api/tenant/domain', verifyApiKey, async (req, res) => {
  try {
    const { customDomain, subdomain } = req.body;
    const tenant = req.tenant;
    
    // Validate domain format
    if (customDomain && !isValidDomain(customDomain)) {
      return res.status(400).json({ error: 'Invalid custom domain format' });
    }
    
    if (subdomain && !isValidSubdomain(subdomain)) {
      return res.status(400).json({ error: 'Invalid subdomain format' });
    }
    
    // Check if domain is already taken
    if (customDomain) {
      const existing = await Tenant.findOne({ customDomain, _id: { $ne: tenant._id } });
      if (existing) {
        return res.status(400).json({ error: 'Custom domain already in use' });
      }
    }
    
    if (subdomain) {
      const existing = await Tenant.findOne({ subdomain, _id: { $ne: tenant._id } });
      if (existing) {
        return res.status(400).json({ error: 'Subdomain already in use' });
      }
    }
    
    // Update tenant
    tenant.customDomain = customDomain || null;
    tenant.subdomain = subdomain || null;
    tenant.domainVerified = false; // Reset verification status
    
    await tenant.save();
    
    res.json({ 
      message: 'Domain settings updated successfully',
      tenant: {
        customDomain: tenant.customDomain,
        subdomain: tenant.subdomain,
        domainVerified: tenant.domainVerified
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tenant/verify-domain', verifyApiKey, async (req, res) => {
  try {
    const tenant = req.tenant;
    
    if (!tenant.customDomain) {
      return res.status(400).json({ error: 'No custom domain configured' });
    }
    
    // Simple verification - check if domain points to our server
    const isVerified = await verifyDomainPointing(tenant.customDomain);
    
    tenant.domainVerified = isVerified;
    await tenant.save();
    
    res.json({ 
      verified: isVerified,
      message: isVerified ? 'Domain verified successfully' : 'Domain verification failed'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tenant/branding', verifyApiKey, async (req, res) => {
  try {
    const { favicon, customCSS, logoUrl, brandColor } = req.body;
    const tenant = req.tenant;
    
    tenant.domainSettings = {
      favicon: favicon || tenant.domainSettings?.favicon,
      customCSS: customCSS || tenant.domainSettings?.customCSS,
      logoUrl: logoUrl || tenant.domainSettings?.logoUrl,
      brandColor: brandColor || tenant.domainSettings?.brandColor || '#3B82F6'
    };
    
    await tenant.save();
    
    res.json({ 
      message: 'Branding updated successfully',
      domainSettings: tenant.domainSettings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function isValidDomain(domain) {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(domain);
}

function isValidSubdomain(subdomain) {
  const subdomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/;
  return subdomainRegex.test(subdomain);
}

async function verifyDomainPointing(domain) {
  try {
    const dns = require('dns').promises;
    const records = await dns.resolve4(domain);
    // Check if any record points to our server IP
    // For now, return true - implement actual IP checking later
    return records.length > 0;
  } catch (error) {
    return false;
  }
}

// Subdomain session management
const subdomainSessions = new Map(); // In production, use Redis

// Generate subdomain access token
function generateSubdomainToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

// Subdomain authentication middleware
function verifySubdomainAccess(req, res, next) {
  // Skip for API routes and static assets
  if (req.path.startsWith('/api/') || req.path.startsWith('/css/') || 
      req.path.startsWith('/js/') || req.path.startsWith('/images/')) {
    return next();
  }

  // If accessing via subdomain
  if (req.domainTenant) {
    const sessionToken = req.cookies[`subdomain_auth_${req.domainTenant.subdomain}`];
    
    // Check if session is valid
    if (sessionToken && subdomainSessions.has(sessionToken)) {
      const session = subdomainSessions.get(sessionToken);
      if (session.tenantId === req.domainTenant._id.toString() && session.expires > Date.now()) {
        req.authenticatedTenant = req.domainTenant;
        return next();
      }
    }
    
    // Redirect to subdomain login
    return res.redirect(`/subdomain-login?subdomain=${req.domainTenant.subdomain}`);
  }
  
  next();
}

// Subdomain login API
app.post('/api/subdomain/login', async (req, res) => {
  try {
    const { subdomain, password } = req.body;
    
    const tenant = await Tenant.findOne({ subdomain });
    if (!tenant) {
      return res.status(404).json({ error: 'Subdomain not found' });
    }
    
    // Check subdomain password (you'll need to add this field to tenant schema)
    if (!tenant.subdomainPassword || tenant.subdomainPassword !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Create session
    const sessionToken = generateSubdomainToken();
    const session = {
      tenantId: tenant._id.toString(),
      subdomain: tenant.subdomain,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    subdomainSessions.set(sessionToken, session);
    
    // Set cookie
    res.cookie(`subdomain_auth_${subdomain}`, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json({ success: true, redirectUrl: '/dashboard' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update subdomain password
app.post('/api/tenant/subdomain-password', verifyApiKey, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    req.tenant.subdomainPassword = password;
    await req.tenant.save();
    
    res.json({ message: 'Subdomain password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply subdomain auth middleware
app.use(verifySubdomainAccess);

// Super Admin middleware
const SUPER_ADMIN_KEY = process.env.SUPER_ADMIN_KEY || 'docforge-super-admin-2025';

function verifySuperAdmin(req, res, next) {
  const adminKey = req.headers['x-super-admin-key'] || req.query.adminKey;
  
  if (!adminKey || adminKey !== SUPER_ADMIN_KEY) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  
  next();
}

// Super Admin Routes
app.get('/api/admin/tenants', verifySuperAdmin, async (req, res) => {
  try {
    const tenants = await Tenant.find({})
      .select('name domain subdomain customDomain domainVerified domainSettings createdAt')
      .sort({ createdAt: -1 });
    
    const stats = {
      totalTenants: tenants.length,
      withSubdomains: tenants.filter(t => t.subdomain).length,
      withCustomDomains: tenants.filter(t => t.customDomain).length,
      verifiedDomains: tenants.filter(t => t.domainVerified).length
    };
    
    res.json({ tenants, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/tenant/:id', verifySuperAdmin, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Get tenant's pages count
    const pagesResponse = await fetch(`http://localhost:3001/api/pages`, {
      headers: { 'X-API-Key': tenant.apiKey }
    }).catch(() => ({ json: () => [] }));
    
    const pages = await pagesResponse.json();
    
    res.json({
      ...tenant.toObject(),
      stats: {
        totalPages: Array.isArray(pages) ? pages.length : 0,
        lastActivity: tenant.updatedAt || tenant.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/tenant/:id', verifySuperAdmin, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Delete tenant's pages and credentials
    await Promise.all([
      Credential.deleteMany({ tenantId: tenant._id }),
      // Add page deletion when implemented
    ]);
    
    await Tenant.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// File upload endpoint
app.post('/api/upload', verifyApiKey, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: fileUrl,
      size: req.file.size
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../static/uploads')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
