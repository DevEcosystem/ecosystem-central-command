/**
 * @fileoverview Issue Classifier - Intelligent issue categorization
 * @version 1.0.0
 * @author DevEcosystem
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/logger.js';

/**
 * Intelligent issue classification system
 * Analyzes issues and applies organization-specific classification rules
 */
export class IssueClassifier extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = config;
    this.logger = new Logger('IssueClassifier');
    this.rules = new Map();
    this.isInitialized = false;
    
    this.logger.info('Issue Classifier created');
  }

  /**
   * Initialize classification rules and patterns
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.logger.info('Initializing Issue Classifier...');
      
      // Load classification rules
      this._loadClassificationRules();
      
      this.isInitialized = true;
      this.logger.info('Issue Classifier initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Issue Classifier', { error: error.message });
      throw error;
    }
  }

  /**
   * Classify an issue based on content and context
   * @param {Object} issue - GitHub issue object
   * @param {Object} context - Additional context information
   * @returns {Promise<Object>} - Classification result
   */
  async classifyIssue(issue, context = {}) {
    this._ensureInitialized();
    
    try {
      this.logger.info('Classifying issue', { 
        issueId: issue.id,
        title: issue.title 
      });

      const classification = {
        type: this._classifyType(issue),
        priority: this._classifyPriority(issue, context),
        complexity: this._classifyComplexity(issue),
        organization: context.organization || 'unknown',
        estimatedHours: this._estimateEffort(issue),
        dependencies: this._analyzeDependencies(issue),
        labels: this._generateLabels(issue, context),
        confidence: 0.85, // TODO: Implement ML confidence scoring
        classifiedAt: new Date().toISOString()
      };

      // Apply organization-specific rules
      this._applyOrganizationRules(classification, context);

      this.emit('issueClassified', { issue, classification, context });
      
      this.logger.info('Issue classified successfully', { 
        issueId: issue.id,
        type: classification.type,
        priority: classification.priority 
      });

      return classification;
    } catch (error) {
      this.logger.error('Failed to classify issue', { 
        issueId: issue.id,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Check if classifier is healthy
   * @returns {boolean} - Health status
   */
  isHealthy() {
    return this.isInitialized && this.rules.size > 0;
  }

  /**
   * Load classification rules and patterns
   * @private
   */
  _loadClassificationRules() {
    // Type classification patterns
    this.rules.set('type_patterns', {
      bug: [/bug/i, /error/i, /fix/i, /broken/i, /issue/i],
      feature: [/feat/i, /feature/i, /add/i, /implement/i, /enhance/i],
      documentation: [/docs/i, /readme/i, /documentation/i, /guide/i],
      security: [/security/i, /vulnerability/i, /exploit/i, /cve/i],
      performance: [/performance/i, /speed/i, /optimize/i, /slow/i],
      refactor: [/refactor/i, /cleanup/i, /improve/i, /restructure/i],
      test: [/test/i, /testing/i, /spec/i, /coverage/i],
      devops: [/ci/i, /cd/i, /deploy/i, /docker/i, /pipeline/i]
    });

    // Priority indicators
    this.rules.set('priority_patterns', {
      critical: [/critical/i, /urgent/i, /blocker/i, /emergency/i],
      high: [/high/i, /important/i, /asap/i, /priority/i],
      low: [/low/i, /minor/i, /nice.*have/i, /someday/i]
    });

    // Complexity indicators
    this.rules.set('complexity_patterns', {
      simple: [/simple/i, /quick/i, /easy/i, /minor/i],
      complex: [/complex/i, /difficult/i, /major/i, /refactor/i, /architecture/i]
    });

    this.logger.info('Classification rules loaded', { 
      ruleCount: this.rules.size 
    });
  }

  /**
   * Classify issue type based on title and body
   * @param {Object} issue - GitHub issue object
   * @returns {string} - Issue type
   * @private
   */
  _classifyType(issue) {
    const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
    const typePatterns = this.rules.get('type_patterns');
    
    // Check for DevFlow specific patterns
    if (text.includes('devflow')) {
      if (text.includes('architecture') || text.includes('design')) return 'architecture';
      if (text.includes('api') || text.includes('integration')) return 'integration';
      if (text.includes('config') || text.includes('setting')) return 'configuration';
      if (text.includes('dashboard') || text.includes('ui')) return 'ui';
    }

    // Check standard patterns
    for (const [type, patterns] of Object.entries(typePatterns)) {
      if (patterns.some(pattern => pattern.test(text))) {
        return type;
      }
    }

    return 'feature'; // Default type
  }

  /**
   * Classify issue priority
   * @param {Object} issue - GitHub issue object
   * @param {Object} context - Additional context
   * @returns {string} - Priority level
   * @private
   */
  _classifyPriority(issue, context) {
    const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
    const priorityPatterns = this.rules.get('priority_patterns');
    
    // Check for explicit priority patterns
    for (const [priority, patterns] of Object.entries(priorityPatterns)) {
      if (patterns.some(pattern => pattern.test(text))) {
        return priority;
      }
    }

    // Organization-specific priority rules
    if (context.organization === 'DevBusinessHub') {
      // Business critical patterns
      if (text.includes('production') || text.includes('customer')) return 'high';
    }

    return 'medium'; // Default priority
  }

  /**
   * Classify issue complexity
   * @param {Object} issue - GitHub issue object
   * @returns {string} - Complexity level
   * @private
   */
  _classifyComplexity(issue) {
    const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
    const complexityPatterns = this.rules.get('complexity_patterns');
    
    // Check for explicit complexity patterns
    for (const [complexity, patterns] of Object.entries(complexityPatterns)) {
      if (patterns.some(pattern => pattern.test(text))) {
        return complexity;
      }
    }

    // Estimate based on description length
    const bodyLength = (issue.body || '').length;
    if (bodyLength > 1000) return 'complex';
    if (bodyLength < 200) return 'simple';
    
    return 'moderate'; // Default complexity
  }

  /**
   * Estimate effort required for issue
   * @param {Object} issue - GitHub issue object
   * @returns {number} - Estimated hours
   * @private
   */
  _estimateEffort(issue) {
    const complexity = this._classifyComplexity(issue);
    const type = this._classifyType(issue);
    
    // Base effort by complexity
    const complexityHours = {
      simple: 2,
      moderate: 8,
      complex: 24
    };

    // Type modifiers
    const typeModifiers = {
      bug: 0.8,
      documentation: 0.6,
      architecture: 1.5,
      integration: 1.3,
      feature: 1.0
    };

    const baseHours = complexityHours[complexity] || 8;
    const modifier = typeModifiers[type] || 1.0;
    
    return Math.round(baseHours * modifier);
  }

  /**
   * Analyze issue dependencies
   * @param {Object} issue - GitHub issue object
   * @returns {Array} - Dependency information
   * @private
   */
  _analyzeDependencies(issue) {
    const dependencies = [];
    const text = `${issue.title} ${issue.body || ''}`;
    
    // Look for issue references
    const issueRefs = text.match(/#\d+/g);
    if (issueRefs) {
      dependencies.push(...issueRefs.map(ref => ({
        type: 'issue',
        reference: ref,
        repository: 'current'
      })));
    }

    // Look for blocking language
    if (/blocked.*by|depends.*on|requires/i.test(text)) {
      dependencies.push({
        type: 'blocking',
        description: 'Issue appears to have blocking dependencies'
      });
    }

    return dependencies;
  }

  /**
   * Generate appropriate labels for issue
   * @param {Object} issue - GitHub issue object
   * @param {Object} context - Additional context
   * @returns {Array} - Generated labels
   * @private
   */
  _generateLabels(issue, context) {
    const labels = [];
    const type = this._classifyType(issue);
    const priority = this._classifyPriority(issue, context);
    
    // Add type label
    labels.push(`type:${type}`);
    
    // Add priority label
    if (priority !== 'medium') {
      labels.push(`priority:${priority}`);
    }
    
    // Add organization label
    if (context.organization) {
      labels.push(`org:${context.organization.toLowerCase()}`);
    }

    // Add DevFlow specific labels
    if (issue.title.includes('DevFlow')) {
      labels.push('devflow:implementation');
      
      if (type === 'architecture') labels.push('devflow:architecture');
      if (type === 'integration') labels.push('devflow:projects-v2');
    }

    return labels;
  }

  /**
   * Apply organization-specific classification rules
   * @param {Object} classification - Classification result to modify
   * @param {Object} context - Context information
   * @private
   */
  _applyOrganizationRules(classification, context) {
    const org = context.organization;
    
    switch (org) {
      case 'DevBusinessHub':
        // Business rules: higher priority for customer-facing issues
        if (classification.type === 'bug' && classification.priority === 'medium') {
          classification.priority = 'high';
        }
        break;
        
      case 'DevAcademicHub':
        // Academic rules: research and documentation focus
        if (classification.type === 'documentation') {
          classification.priority = 'high';
        }
        break;
        
      case 'DevEcosystem':
        // Infrastructure rules: stability and automation priority
        if (classification.type === 'devops' || classification.type === 'architecture') {
          classification.priority = 'high';
        }
        break;
    }
  }

  /**
   * Ensure classifier is initialized
   * @private
   */
  _ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Issue Classifier not initialized. Call initialize() first.');
    }
  }
}

export default IssueClassifier;