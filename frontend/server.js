const express = require('express');
const path = require('path');
const axios = require('axios');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.FRONTEND_PORT || 3000;
const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await axios({
      url: `${API_BASE}${endpoint}`,
      method: options.method || 'GET',
      headers: options.headers || {},
      data: options.data
    });
    return response.data;
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    return null;
  }
};

// Domain identification middleware
async function identifyTenantByDomain(req, res, next) {
  try {
    const host = req.get('host');
    let tenant = null;
    
    // Skip API calls and static assets
    if (req.path.startsWith('/api/') || req.path.startsWith('/css/') || req.path.startsWith('/js/') || req.path.startsWith('/images/')) {
      return next();
    }
    
    // Check for custom domain first
    const customDomainResponse = await apiCall('/tenant/by-domain', {
      method: 'POST',
      data: { domain: host, type: 'custom' }
    }).catch(() => null);
    
    if (customDomainResponse) {
      tenant = customDomainResponse;
    }
    
    // Check for subdomain (company.docforge.com)
    if (!tenant && host.includes('.docforge.com')) {
      const subdomain = host.split('.')[0];
      const subdomainResponse = await apiCall('/tenant/by-domain', {
        method: 'POST',
        data: { domain: subdomain, type: 'subdomain' }
      }).catch(() => null);
      
      if (subdomainResponse) {
        tenant = subdomainResponse;
      }
    }
    
    // Store tenant info for later use
    if (tenant) {
      req.domainTenant = tenant;
      req.autoApiKey = tenant.apiKey;
      
      console.log('Tenant found:', {
        subdomain: tenant.subdomain,
        hasPassword: !!tenant.subdomainPassword,
        path: req.path,
        host: host
      });
      
      // Check if subdomain requires authentication
      if (tenant.subdomain && tenant.subdomainPassword) {
        const sessionToken = req.cookies[`subdomain_auth_${tenant.subdomain}`];
        
        console.log('Auth check:', {
          subdomain: tenant.subdomain,
          hasSessionToken: !!sessionToken,
          path: req.path
        });
        
        // Skip auth check for login page
        if (req.path === '/subdomain-login') {
          return next();
        }
        
        // Check if session is valid (simplified check for now)
        if (!sessionToken) {
          console.log('Redirecting to login page');
          return res.redirect(`/subdomain-login?subdomain=${tenant.subdomain}`);
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Domain identification error:', error);
    next();
  }
}

// Apply domain middleware
app.use(identifyTenantByDomain);

// Routes
app.get('/', async (req, res) => {
  const apiKey = req.query.apiKey || req.headers['x-api-key'] || req.autoApiKey;
  
  // If we have a domain tenant (from subdomain), redirect to dashboard
  if (req.domainTenant && !req.query.apiKey) {
    return res.redirect(`/dashboard?apiKey=${req.domainTenant.apiKey}`);
  }
  
  let tenant = null;
  let pages = [];
  let stats = {
    totalPages: 0,
    categories: 0,
    recentPages: [],
    lastUpdated: null
  };
  
  if (apiKey) {
    // Fetch tenant data for white-labeling
    const [tenantInfo, tenantPages] = await Promise.all([
      apiCall('/tenant/info', { headers: { 'X-API-Key': apiKey } }),
      apiCall('/pages', { headers: { 'X-API-Key': apiKey } })
    ]);
    
    tenant = tenantInfo;
    pages = tenantPages || [];
    
    // Calculate stats
    stats = {
      totalPages: pages.length,
      categories: [...new Set(pages.map(p => p.category))].length,
      recentPages: pages.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3),
      lastUpdated: pages.length > 0 ? new Date(Math.max(...pages.map(p => new Date(p.updatedAt)))) : null
    };
  }
  
  res.render('index', { 
    title: tenant ? `${tenant.name} Documentation` : 'DocForge - Where Great Documentation is Forged',
    page: 'home',
    tenant: tenant,
    apiKey: apiKey || '',
    pages: pages,
    stats: stats
  });
});

app.get('/dashboard', async (req, res) => {
  const apiKey = req.query.apiKey || req.headers['x-api-key'] || req.autoApiKey;
  
  if (!apiKey) {
    return res.redirect('/connect');
  }

  const [tenantInfo, pages, credentials] = await Promise.all([
    apiCall('/tenant/info', { headers: { 'X-API-Key': apiKey } }),
    apiCall('/pages', { headers: { 'X-API-Key': apiKey } }),
    apiCall('/credentials', { headers: { 'X-API-Key': apiKey } })
  ]);

  res.render('dashboard', {
    title: 'Dashboard - DocForge',
    page: 'dashboard',
    tenant: tenantInfo,
    pages: pages || [],
    credentials: credentials || [],
    apiKey
  });
});

app.get('/docs', async (req, res) => {
  const apiKey = req.query.apiKey || req.headers['x-api-key'] || req.autoApiKey;
  const category = req.query.category;
  
  if (!apiKey) {
    return res.redirect('/connect');
  }

  try {
    const [tenantInfo, pages] = await Promise.all([
      apiCall('/tenant/info', { headers: { 'X-API-Key': apiKey } }).catch(err => {
        console.error('Failed to fetch tenant info:', err);
        return null;
      }),
      apiCall('/pages', { headers: { 'X-API-Key': apiKey } }).catch(err => {
        console.error('Failed to fetch pages:', err);
        return [];
      })
    ]);

    const filteredPages = category ? 
      (pages || []).filter(p => p.category === category) : 
      (pages || []);

    const categories = [...new Set((pages || []).map(p => p.category))];

    res.render('docs', {
      title: 'Documentation - DocForge',
      page: 'docs',
      tenant: tenantInfo,
      pages: filteredPages,
      categories,
      selectedCategory: category,
      apiKey
    });
  } catch (error) {
    console.error('Error in docs route:', error);
    res.render('docs', {
      title: 'Documentation - DocForge',
      page: 'docs',
      tenant: null,
      pages: [],
      categories: [],
      selectedCategory: category,
      apiKey,
      error: 'Failed to load documentation'
    });
  }
});

app.get('/docs/:category/:slug', async (req, res) => {
  const apiKey = req.query.apiKey || req.headers['x-api-key'] || req.autoApiKey;
  
  if (!apiKey) {
    return res.redirect('/connect');
  }

  const [tenantInfo, pages] = await Promise.all([
    apiCall('/tenant/info', { headers: { 'X-API-Key': apiKey } }),
    apiCall('/pages', { headers: { 'X-API-Key': apiKey } })
  ]);

  const page = (pages || []).find(p => p.slug === req.params.slug && p.category === req.params.category);

  if (!page) {
    return res.status(404).render('404', { title: 'Page Not Found' });
  }

  res.render('page', {
    title: `${page.title} - DocForge`,
    page: 'docs',
    tenant: tenantInfo,
    doc: page,
    apiKey
  });
});

app.get('/editor', async (req, res) => {
  const apiKey = req.query.apiKey || req.autoApiKey;
  const editId = req.query.edit;
  
  if (!apiKey) {
    return res.redirect('/connect');
  }
  
  try {
    let tenant = null;
    let editPage = null;
    
    // Get tenant info
    if (apiKey) {
      tenant = await apiCall('/tenant/info', { headers: { 'X-API-Key': apiKey } }).catch(() => null);
    }
    
    // If editing existing page, load page data
    if (editId) {
      try {
        const pages = await apiCall('/pages', { headers: { 'X-API-Key': apiKey } });
        editPage = pages.find(p => p._id === editId);
      } catch (error) {
        console.error('Failed to load page for editing:', error);
      }
    }
    
    res.render('editor', {
      title: editPage ? `Edit: ${editPage.title}` : 'New Page - DocForge',
      page: 'editor',
      tenant: tenant,
      apiKey: apiKey,
      editPage: editPage || null
    });
  } catch (error) {
    console.error('Error in editor route:', error);
    res.render('editor', {
      title: 'Editor - DocForge',
      page: 'editor',
      tenant: null,
      apiKey: apiKey || '',
      editPage: null,
      error: 'Failed to load editor'
    });
  }
});

app.get('/credentials', async (req, res) => {
  const apiKey = req.query.apiKey;
  
  if (!apiKey) {
    return res.redirect('/connect');
  }

  const [tenantInfo, credentials] = await Promise.all([
    apiCall('/tenant/info', { headers: { 'X-API-Key': apiKey } }),
    apiCall('/credentials', { headers: { 'X-API-Key': apiKey } })
  ]);

  res.render('credentials', {
    title: 'Credentials - DocForge',
    page: 'credentials',
    tenant: tenantInfo,
    credentials: credentials || [],
    apiKey
  });
});

app.get('/domains', async (req, res) => {
  const apiKey = req.query.apiKey || req.autoApiKey;
  
  if (!apiKey) {
    return res.redirect('/connect');
  }

  // If accessed via subdomain without API key in URL, redirect with API key
  if (req.autoApiKey && !req.query.apiKey) {
    return res.redirect(`/domains?apiKey=${req.autoApiKey}`);
  }

  const [tenantInfo] = await Promise.all([
    apiCall('/tenant/info', { headers: { 'X-API-Key': apiKey } })
  ]);
  
  res.render('domains', {
    title: 'Domain Settings - DocForge',
    page: 'domains',
    tenant: tenantInfo,
    apiKey: apiKey
  });
});

app.get('/subdomain-login', (req, res) => {
  const subdomain = req.query.subdomain;
  
  if (!subdomain) {
    return res.redirect('/');
  }
  
  res.render('subdomain-login', {
    title: `Access Required - ${subdomain}`,
    subdomain: subdomain
  });
});

app.get('/admin', (req, res) => {
  const adminKey = req.query.adminKey;
  const SUPER_ADMIN_KEY = process.env.SUPER_ADMIN_KEY || 'docforge-super-admin-2025';
  
  if (!adminKey || adminKey !== SUPER_ADMIN_KEY) {
    return res.status(403).send('Super admin access required');
  }
  
  res.render('admin', {
    title: 'Super Admin - DocForge',
    page: 'admin'
  });
});

app.get('/api/docs', (req, res) => {
  res.render('api-docs', {
    title: 'API Documentation - DocForge',
    page: 'api-docs'
  });
});

app.get('/connect', (req, res) => {
  res.render('connect', {
    title: 'Connect Tenant - DocForge',
    page: 'connect'
  });
});

app.get('/create-tenant', (req, res) => {
  res.render('create-tenant', {
    title: 'Create Tenant - DocForge',
    page: 'create-tenant'
  });
});

// API proxy routes
app.get('/api/credentials/:id', async (req, res) => {
  const endpoint = `/credentials/${req.params.id}`;
  const result = await apiCall(endpoint, {
    headers: req.headers
  });
  res.json(result);
});

app.delete('/api/credentials/:id', async (req, res) => {
  const endpoint = `/credentials/${req.params.id}`;
  const result = await apiCall(endpoint, {
    method: 'DELETE',
    headers: req.headers
  });
  res.json(result);
});

app.put('/api/credentials/:id', async (req, res) => {
  const endpoint = `/credentials/${req.params.id}`;
  const result = await apiCall(endpoint, {
    method: 'PUT',
    headers: req.headers,
    data: req.body
  });
  res.json(result);
});

app.post('/api/*', async (req, res) => {
  const endpoint = req.path.replace('/api', '');
  const result = await apiCall(endpoint, {
    method: 'POST',
    headers: req.headers,
    data: req.body
  });
  res.json(result);
});

app.get('/api/*', async (req, res) => {
  const endpoint = req.path.replace('/api', '');
  const result = await apiCall(endpoint, {
    headers: req.headers
  });
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`DocForge Frontend running on port ${PORT}`);
});
