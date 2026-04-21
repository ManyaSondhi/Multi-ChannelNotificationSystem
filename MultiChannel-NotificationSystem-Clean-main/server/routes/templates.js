const express = require('express');
const TemplateService = require('../services/TemplateService');
const { validations } = require('../middleware/validation');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

/**
 * Get all templates
 * Requires authentication
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    logger.info('Fetching templates', { 
      query: req.query, 
      userId: req.user?._id,
      userRole: req.user?.role 
    });
    
    const templates = await TemplateService.getAll(req.query);
    logger.info(`Successfully fetched ${templates.length} templates`);
    
    // Ensure templates are plain objects for JSON serialization
    const templatesList = templates.map(template => {
      if (template.toObject) {
        return template.toObject();
      }
      return template;
    });
    
    res.json({ templates: templatesList });
  } catch (error) {
    logger.error(`Error fetching templates: ${error.message}`, {
      stack: error.stack,
      query: req.query,
      userId: req.user?._id,
      errorName: error.name,
      errorCode: error.code,
    });
    // Ensure we send a proper error response
    if (!res.headersSent) {
      next(error);
    }
  }
});

/**
 * Get template by code (must be before /:id route)
 */
router.get('/code/:code', authenticate, async (req, res, next) => {
  try {
    const template = await TemplateService.getByCode(req.params.code);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ template });
  } catch (error) {
    next(error);
  }
});

/**
 * Get template by ID
 * Note: This route will match any string, but validation will catch invalid IDs
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Handle special cases - prevent matching invalid IDs
    if (id === 'new' || id === 'undefined' || id === 'new:1' || id.startsWith('new:')) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Validate MongoDB ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid template ID format' });
    }
    
    const template = await TemplateService.getById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    // Convert Mongoose document to plain object for JSON serialization
    const templateObj = template.toObject ? template.toObject() : template;
    res.json({ template: templateObj });
  } catch (error) {
    next(error);
  }
});

/**
 * Create template (admin only)
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validations.createTemplate,
  async (req, res, next) => {
    try {
      logger.info('Creating template request received', { 
        body: JSON.stringify(req.body, null, 2),
        userId: req.user._id,
        headers: req.headers 
      });
      
      // Remove any id fields from request body (should not be present for new templates)
      const { _id, id, __v, createdAt, updatedAt, ...cleanBody } = req.body;
      
      const templateData = {
        ...cleanBody,
        createdBy: req.user._id,
      };
      
      logger.info('Template data prepared', { 
        code: templateData.code,
        name: templateData.name,
        hasChannels: !!templateData.channels,
        channels: templateData.channels ? Object.keys(templateData.channels) : []
      });
      
      const template = await TemplateService.create(templateData);
      // Convert Mongoose document to plain object for JSON serialization
      const templateObj = template.toObject ? template.toObject() : template;
      logger.info('Template created successfully', { templateId: templateObj._id });
      res.status(201).json({ template: templateObj });
    } catch (error) {
      logger.error('Error in template creation route', {
        error: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue,
        errors: error.errors,
        body: JSON.stringify(req.body, null, 2),
      });
      next(error);
    }
  }
);

/**
 * Update template (admin only)
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Handle special cases - prevent matching invalid IDs
      if (id === 'new' || id === 'undefined' || id === 'new:1' || id.startsWith('new:')) {
        return res.status(400).json({ error: 'Invalid template ID' });
      }
      
      // Validate MongoDB ObjectId format
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid template ID format' });
      }
      
      // Validate update data
      const validationErrors = [];
      if (req.body.name !== undefined && !req.body.name.trim()) {
        validationErrors.push({ field: 'name', message: 'Name cannot be empty' });
      }
      if (req.body.code !== undefined && !/^[A-Z0-9_]+$/.test(req.body.code)) {
        validationErrors.push({ field: 'code', message: 'Code must contain only uppercase letters, numbers, and underscores' });
      }
      
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation error',
          details: validationErrors,
        });
      }
      
      const template = await TemplateService.update(id, req.body);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      const templateObj = template.toObject ? template.toObject() : template;
      res.json({ template: templateObj });
    } catch (error) {
      logger.error(`Error updating template: ${error.message}`, {
        stack: error.stack,
        templateId: req.params.id,
        userId: req.user?._id,
      });
      next(error);
    }
  }
);

/**
 * Preview template with sample data
 */
router.post(
  '/:id/preview',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { channel, data = {}, locale = 'en' } = req.body;
      
      // Handle special cases - prevent matching invalid IDs
      if (id === 'new' || id === 'undefined' || id === 'new:1' || id.startsWith('new:')) {
        return res.status(400).json({ error: 'Invalid template ID' });
      }
      
      // Validate MongoDB ObjectId format
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid template ID format' });
      }

      if (!channel || !['email', 'webpush'].includes(channel)) {
        return res.status(400).json({ error: 'Valid channel required' });
      }

      const rendered = await TemplateService.preview(id, channel, data, locale);
      
      if (!rendered) {
        return res.status(400).json({ error: 'Template not configured for this channel' });
      }

      res.json({ rendered });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Validate template data
 */
router.post(
  '/:id/validate',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { data = {} } = req.body;
      
      // Handle special cases - prevent matching invalid IDs
      if (id === 'new' || id === 'undefined' || id === 'new:1' || id.startsWith('new:')) {
        return res.status(400).json({ error: 'Invalid template ID' });
      }
      
      // Validate MongoDB ObjectId format
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid template ID format' });
      }

      const template = await TemplateService.getById(id);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const validation = TemplateService.validateTemplateData(template, data);
      res.json({ validation });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Sync templates to JSON file (admin only)
 * Manual endpoint to trigger sync
 */
router.post('/sync-to-file', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { syncTemplatesToFile } = require('../utils/templatesSync');
    const result = await syncTemplatesToFile();
    
    if (result.success) {
      logger.info(`Manual sync completed: ${result.count} templates synced`);
      res.json({
        success: true,
        message: `Successfully synced ${result.count} templates to templates.json`,
        count: result.count,
        filePath: result.filePath,
      });
    } else {
      logger.error(`Manual sync failed: ${result.error}`);
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to sync templates to JSON file',
      });
    }
  } catch (error) {
    logger.error(`Error in manual sync: ${error.message}`, {
      stack: error.stack,
    });
    next(error);
  }
});

module.exports = router;







