const fs = require('fs');
const path = require('path');
const Template = require('../models/Template');
const logger = require('./logger');

/**
 * Sync all templates from MongoDB to templates.json file
 * This ensures the JSON file is always in sync with the database
 */
async function syncTemplatesToFile() {
  try {
    // Get the templates.json file path
    // In Docker: /app/server/utils -> /app/templates.json (mounted volume)
    // Locally: server/utils -> project root/templates.json
    // Always use /app/templates.json in Docker, or project root locally
    let templatesFilePath;
    if (process.env.DOCKER_ENV === 'true') {
      // In Docker, file is mounted at /app/templates.json
      templatesFilePath = '/app/templates.json';
    } else {
      // Local development, use project root
      const projectRoot = path.resolve(__dirname, '../../');
      templatesFilePath = path.join(projectRoot, 'templates.json');
    }
    
    logger.info(`Syncing templates to: ${templatesFilePath} (DOCKER_ENV: ${process.env.DOCKER_ENV})`);
    
    // Fetch all templates from MongoDB
    const templates = await Template.find({})
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    if (!templates || templates.length === 0) {
      logger.warn('No templates found in MongoDB to sync');
      // Write empty array to file
      fs.writeFileSync(
        templatesFilePath,
        JSON.stringify([], null, 2),
        'utf8'
      );
      return { success: true, count: 0 };
    }
    
    // Convert MongoDB documents to plain JSON objects
    // Remove Mongoose-specific properties and convert ObjectIds to strings
    const templatesData = templates.map(template => {
      const templateObj = {
        _id: template._id.toString(),
        name: template.name,
        code: template.code,
        version: template.version || 1,
        description: template.description || '',
        channels: template.channels || {},
        variables: template.variables || [],
        isActive: template.isActive !== undefined ? template.isActive : true,
        createdAt: template.createdAt ? template.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: template.updatedAt ? template.updatedAt.toISOString() : new Date().toISOString(),
      };
      
      // Add createdBy if it exists
      if (template.createdBy) {
        templateObj.createdBy = template.createdBy.toString();
      }
      
      return templateObj;
    });
    
    // Ensure directory exists
    const templatesDir = path.dirname(templatesFilePath);
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
      logger.info(`Created directory: ${templatesDir}`);
    }
    
    // Write to JSON file with pretty formatting
    fs.writeFileSync(
      templatesFilePath,
      JSON.stringify(templatesData, null, 2),
      'utf8'
    );
    
    logger.info(`✅ Successfully synced ${templatesData.length} templates to templates.json at ${templatesFilePath}`);
    return { success: true, count: templatesData.length, filePath: templatesFilePath };
  } catch (error) {
    logger.error(`❌ Error syncing templates to file: ${error.message}`, {
      stack: error.stack,
      errorName: error.name,
      errorCode: error.code,
    });
    // Don't throw error - file sync is optional, MongoDB is the source of truth
    return { success: false, error: error.message };
  }
}

/**
 * Sync templates to file (non-blocking)
 * Use this for async operations that shouldn't block the response
 */
function syncTemplatesToFileAsync() {
  // Run in background, don't wait for it
  setImmediate(async () => {
    try {
      const result = await syncTemplatesToFile();
      if (!result.success) {
        logger.warn(`Template sync completed with errors: ${result.error}`);
      }
    } catch (err) {
      logger.error('Background template sync failed:', {
        error: err.message,
        stack: err.stack,
      });
    }
  });
}

module.exports = {
  syncTemplatesToFile,
  syncTemplatesToFileAsync,
};

