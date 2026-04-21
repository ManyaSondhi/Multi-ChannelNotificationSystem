/**
 * Simple template engine for variable substitution
 * Supports {{variable}} syntax and nested object access ({{user.name}})
 */
class TemplateEngine {
  /**
   * Replace template variables with data
   * @param {string} template - Template string with {{variable}} placeholders
   * @param {Object} data - Data object for substitution
   * @returns {string} - Rendered template
   */
  static render(template, data = {}) {
    if (!template || typeof template !== 'string') {
      return template;
    }

    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path.trim());
      return value !== undefined && value !== null ? String(value) : match;
    });
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to traverse
   * @param {string} path - Dot-separated path (e.g., 'user.name')
   * @returns {*} - Value or undefined
   */
  static getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    
    const parts = path.trim().split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      // Handle both object property access and array-like access
      if (typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Validate template variables against data
   * @param {string} template - Template string
   * @param {Object} data - Data object
   * @returns {Object} - { valid: boolean, missing: string[] }
   */
  static validate(template, data = {}) {
    if (!template || typeof template !== 'string') {
      return { valid: true, missing: [] };
    }

    const variables = [];
    const regex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = regex.exec(template)) !== null) {
      const path = match[1].trim();
      if (!variables.includes(path)) {
        variables.push(path);
      }
    }

    const missing = variables.filter((path) => {
      const value = this.getNestedValue(data, path);
      return value === undefined || value === null;
    });

    return {
      valid: missing.length === 0,
      missing,
      found: variables.filter((v) => !missing.includes(v)),
    };
  }

  /**
   * Extract all variables from template
   * @param {string} template - Template string
   * @returns {string[]} - Array of variable names
   */
  static extractVariables(template) {
    if (!template || typeof template !== 'string') {
      return [];
    }

    const variables = [];
    const regex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = regex.exec(template)) !== null) {
      const path = match[1].trim();
      if (!variables.includes(path)) {
        variables.push(path);
      }
    }

    return variables;
  }
}

module.exports = TemplateEngine;







