const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const xss = require('xss');

// Rate limiting
const createTenantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tenant creations per IP
  message: 'Too many tenant creation attempts'
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per 15 minutes
  message: 'Too many API requests'
});

// Input validation
const validateTenant = (req, res, next) => {
  const { name, domain } = req.body;
  
  if (!name || !validator.isLength(name, { min: 2, max: 50 })) {
    return res.status(400).json({ error: 'Invalid tenant name' });
  }
  
  if (!domain || !validator.isFQDN(domain)) {
    return res.status(400).json({ error: 'Invalid domain' });
  }
  
  // Sanitize inputs
  req.body.name = xss(name.trim());
  req.body.domain = xss(domain.trim().toLowerCase());
  
  next();
};

const validateCredentials = (req, res, next) => {
  const { serviceName, environment } = req.body;
  
  if (!serviceName || !validator.isLength(serviceName, { min: 2, max: 100 })) {
    return res.status(400).json({ error: 'Invalid service name' });
  }
  
  if (!['production', 'staging', 'testing'].includes(environment)) {
    return res.status(400).json({ error: 'Invalid environment' });
  }
  
  next();
};

module.exports = {
  helmet: helmet(),
  createTenantLimiter,
  apiLimiter,
  validateTenant,
  validateCredentials
};
