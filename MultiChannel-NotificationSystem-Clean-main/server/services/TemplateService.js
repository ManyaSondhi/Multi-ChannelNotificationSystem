const Template = require('../models/Template');
const TemplateEngine = require('../utils/templateEngine');
const logger = require('../utils/logger');
const { syncTemplatesToFileAsync } = require('../utils/templatesSync');

class TemplateService {
  /**
   * Get all templates
   */
  async getAll(filters = {}) {
    try {
      // Build query - include all templates, filter by isActive if needed
      const query = {};
      
      // Only add isActive filter if explicitly provided
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive === true || filters.isActive === 'true';
      }
      
      if (filters.code) {
        query.code = filters.code.toUpperCase();
      }
      
      // Use lean() to get plain JavaScript objects instead of Mongoose documents
      // This ensures proper JSON serialization
      const templates = await Template.find(query)
        .sort({ name: 1 })
        .lean()
        .exec();
      
      // Ensure all templates are plain objects (lean() should already do this, but be safe)
      const plainTemplates = templates.map(template => {
        // Remove any Mongoose-specific properties if they exist
        const { __v, ...cleanTemplate } = template;
        return cleanTemplate;
      });
      
      logger.info(`Retrieved ${plainTemplates.length} templates`, {
        count: plainTemplates.length,
        query: JSON.stringify(query),
      });
      return plainTemplates;
    } catch (error) {
      logger.error(`Error fetching templates: ${error.message}`, {
        error: error.message,
        stack: error.stack,
        filters: JSON.stringify(filters),
      });
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getById(templateId) {
    return await Template.findById(templateId);
  }

  /**
   * Get template by code
   */
  async getByCode(code) {
    return await Template.findOne({ code: code.toUpperCase(), isActive: true })
      .sort({ version: -1 }); // Get latest version
  }

  /**
   * Create new template
   */
  async create(templateData) {
    try {
      // Ensure code is uppercase
      const code = templateData.code?.toUpperCase().trim();
      if (!code) {
        throw new Error('Template code is required');
      }
      
      // Check if template with same code already exists
      const existing = await Template.findOne({ code });
      if (existing) {
        throw new Error(`Template with code "${code}" already exists`);
      }
      
      // Ensure channels object exists with proper structure
      const templateToCreate = {
        name: templateData.name,
        code,
        description: templateData.description || '',
        channels: templateData.channels || {},
        variables: templateData.variables || [],
        isActive: templateData.isActive !== undefined ? templateData.isActive : true,
        createdBy: templateData.createdBy,
      };
      
      // Ensure each channel has proper structure with enabled property
      ['email', 'webpush'].forEach(channel => {
        if (!templateToCreate.channels[channel]) {
          templateToCreate.channels[channel] = { enabled: false };
        } else {
          // Ensure enabled property exists
          if (templateToCreate.channels[channel].enabled === undefined) {
            templateToCreate.channels[channel].enabled = false;
          }
          // Clean up channel data - only include valid fields
          const channelData = templateToCreate.channels[channel];
          if (channel === 'email') {
            templateToCreate.channels[channel] = {
              enabled: channelData.enabled || false,
              subject: channelData.subject || '',
              html: channelData.html || '',
              text: channelData.text || '',
            };
          } else if (channel === 'webpush') {
            templateToCreate.channels[channel] = {
              enabled: channelData.enabled || false,
              title: channelData.title || '',
              body: channelData.body || '',
              icon: channelData.icon || '',
              badge: channelData.badge || '',
              data: channelData.data || {},
              actions: channelData.actions || [],
            };
          }
        }
      });
      
      logger.info('Creating template with data', {
        code: templateToCreate.code,
        name: templateToCreate.name,
        channels: Object.keys(templateToCreate.channels),
      });
      
      const template = new Template(templateToCreate);
      const savedTemplate = await template.save();
      logger.info(`Template created: ${savedTemplate._id} (${code})`);
      
      // Sync templates to JSON file (non-blocking)
      syncTemplatesToFileAsync();
      
      return savedTemplate;
    } catch (error) {
      logger.error(`Error creating template: ${error.message}`, {
        error: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue,
        errors: error.errors,
        templateData: {
          code: templateData.code,
          name: templateData.name,
        },
      });
      throw error;
    }
  }

  /**
   * Update template
   */
  async update(templateId, updates) {
    try {
      // Ensure code is uppercase if provided
      if (updates.code) {
        updates.code = updates.code.toUpperCase().trim();
      }
      
      const template = await Template.findByIdAndUpdate(
        templateId,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      logger.info(`Template updated: ${template._id}`);
      
      // Sync templates to JSON file (non-blocking)
      syncTemplatesToFileAsync();
      
      return template;
    } catch (error) {
      logger.error(`Error updating template: ${error.message}`, {
        error: error.message,
        stack: error.stack,
        templateId,
      });
      throw error;
    }
  }

  /**
   * Render template for a specific channel
   */
  renderTemplate(template, channel, data = {}, locale = 'en') {
    // Get locale-specific template if available
    const localeTemplate = template.locales?.get(locale);
    const channelConfig = localeTemplate?.[channel] || template.channels[channel];

    if (!channelConfig || !channelConfig.enabled) {
      return null;
    }

    const rendered = {};

    if (channel === 'email') {
      rendered.subject = TemplateEngine.render(channelConfig.subject || '', data);
      rendered.html = TemplateEngine.render(channelConfig.html || '', data);
      rendered.text = TemplateEngine.render(channelConfig.text || '', data);
    } else if (channel === 'webpush') {
      rendered.title = TemplateEngine.render(channelConfig.title || '', data);
      rendered.body = TemplateEngine.render(channelConfig.body || '', data);
      rendered.icon = channelConfig.icon;
      rendered.badge = channelConfig.badge;
      rendered.data = channelConfig.data || {};
      rendered.actions = channelConfig.actions || [];
      
      // Render action titles
      if (rendered.actions) {
        rendered.actions = rendered.actions.map(action => ({
          ...action,
          title: TemplateEngine.render(action.title || '', data),
        }));
      }
    }

    return rendered;
  }

  /**
   * Preview template with sample data
   */
  async preview(templateId, channel, sampleData = {}, locale = 'en') {
    const template = await this.getById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return this.renderTemplate(template, channel, sampleData, locale);
  }

  /**
   * Validate template variables
   */
  validateTemplateData(template, data = {}) {
    const results = {};
    const channels = ['email', 'webpush'];

    for (const channel of channels) {
      const channelConfig = template.channels[channel];
      if (!channelConfig || !channelConfig.enabled) continue;

      if (channel === 'email') {
        results.email = {
          subject: TemplateEngine.validate(channelConfig.subject || '', data),
          html: TemplateEngine.validate(channelConfig.html || '', data),
          text: TemplateEngine.validate(channelConfig.text || '', data),
        };
      } else if (channel === 'webpush') {
        results.webpush = {
          title: TemplateEngine.validate(channelConfig.title || '', data),
          body: TemplateEngine.validate(channelConfig.body || '', data),
        };
      }
    }

    return results;
  }

  /**
   * Extract all variables from a template (across all channels)
   */
  extractTemplateVariables(template) {
    const variables = new Set();
    const channels = ['email', 'webpush'];

    for (const channel of channels) {
      const channelConfig = template.channels[channel];
      if (!channelConfig || !channelConfig.enabled) continue;

      if (channel === 'email') {
        if (channelConfig.subject) {
          TemplateEngine.extractVariables(channelConfig.subject).forEach(v => variables.add(v));
        }
        if (channelConfig.html) {
          TemplateEngine.extractVariables(channelConfig.html).forEach(v => variables.add(v));
        }
        if (channelConfig.text) {
          TemplateEngine.extractVariables(channelConfig.text).forEach(v => variables.add(v));
        }
      } else if (channel === 'webpush') {
        if (channelConfig.title) {
          TemplateEngine.extractVariables(channelConfig.title).forEach(v => variables.add(v));
        }
        if (channelConfig.body) {
          TemplateEngine.extractVariables(channelConfig.body).forEach(v => variables.add(v));
        }
      }
    }

    return Array.from(variables);
  }
}

module.exports = new TemplateService();







