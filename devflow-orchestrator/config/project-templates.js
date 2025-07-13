/**
 * @fileoverview Project Templates for Organization-Specific Configurations
 * @version 1.0.0
 * @author DevEcosystem
 */

import { Logger } from '../utils/logger.js';

/**
 * Project template manager for organization-specific project configurations
 * Provides templates, field configurations, and views for GitHub Projects V2
 */
export class ProjectTemplateManager {
  constructor() {
    this.logger = new Logger('ProjectTemplateManager');
    this.templates = new Map();
    
    this._loadProjectTemplates();
    this.logger.info('Project Template Manager initialized', { 
      templateCount: this.templates.size 
    });
  }

  /**
   * Get template by ID
   * @param {string} templateId - Template identifier
   * @returns {Object|null} - Template configuration
   */
  getTemplate(templateId) {
    const template = this.templates.get(templateId);
    if (!template) {
      this.logger.warn('Template not found', { templateId });
      return null;
    }
    
    this.logger.debug('Template retrieved', { templateId });
    return { ...template }; // Return copy to prevent mutations
  }

  /**
   * Get all available templates
   * @returns {Array} - List of template IDs and names
   */
  getAvailableTemplates() {
    return Array.from(this.templates.entries()).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      organizationType: template.organizationType
    }));
  }

  /**
   * Apply template to project configuration
   * @param {string} templateId - Template identifier
   * @param {Object} context - Application context (repository, organization)
   * @returns {Object} - Applied configuration
   */
  applyTemplate(templateId, context = {}) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    this.logger.info('Applying project template', { 
      templateId, 
      repository: context.repository,
      organization: context.organization
    });

    // Apply context-specific customizations
    const appliedConfig = {
      ...template,
      title: this._generateTitle(template, context),
      description: this._generateDescription(template, context),
      readme: this._generateReadme(template, context),
      fields: this._customizeFields(template.fields, context),
      views: this._customizeViews(template.views, context),
      appliedAt: new Date().toISOString(),
      context
    };

    this.logger.info('Template applied successfully', { 
      templateId,
      fieldsCount: appliedConfig.fields.length,
      viewsCount: appliedConfig.views.length
    });

    return appliedConfig;
  }

  /**
   * Load all project templates
   * @private
   */
  _loadProjectTemplates() {
    // Production-Ready Template (DevBusinessHub)
    this.templates.set('production-ready', {
      id: 'production-ready',
      name: 'Production Ready Project',
      description: 'Enterprise-grade project template with comprehensive workflow management',
      organizationType: 'production',
      settings: {
        public: false,
        securityLevel: 'high',
        approvalRequired: true,
        autoDeployment: true
      },
      fields: [
        {
          name: 'Status',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'Backlog', color: 'GRAY' },
            { name: 'In Progress', color: 'YELLOW' },
            { name: 'Review', color: 'ORANGE' },
            { name: 'Testing', color: 'BLUE' },
            { name: 'Staging', color: 'PURPLE' },
            { name: 'Done', color: 'GREEN' }
          ]
        },
        {
          name: 'Priority',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'Critical', color: 'RED' },
            { name: 'High', color: 'ORANGE' },
            { name: 'Medium', color: 'YELLOW' },
            { name: 'Low', color: 'GRAY' }
          ]
        },
        {
          name: 'Customer Impact',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'High', color: 'RED' },
            { name: 'Medium', color: 'ORANGE' },
            { name: 'Low', color: 'YELLOW' },
            { name: 'None', color: 'GRAY' }
          ]
        },
        {
          name: 'Story Points',
          type: 'NUMBER'
        },
        {
          name: 'Sprint',
          type: 'ITERATION'
        },
        {
          name: 'Assignee',
          type: 'ASSIGNEES'
        },
        {
          name: 'Due Date',
          type: 'DATE'
        }
      ],
      views: [
        {
          name: 'Kanban Board',
          layout: 'BOARD_LAYOUT',
          groupBy: 'Status',
          sortBy: 'Priority'
        },
        {
          name: 'Priority Matrix',
          layout: 'TABLE_LAYOUT',
          groupBy: 'Priority',
          sortBy: 'Customer Impact'
        },
        {
          name: 'Sprint Planning',
          layout: 'TABLE_LAYOUT',
          groupBy: 'Sprint',
          sortBy: 'Story Points'
        },
        {
          name: 'Customer Impact View',
          layout: 'TABLE_LAYOUT',
          groupBy: 'Customer Impact',
          sortBy: 'Priority'
        }
      ],
      workflows: ['security-scan', 'performance-test', 'deploy-staging', 'customer-notification'],
      automationRules: {
        issueLabeling: true,
        projectRouting: true,
        deploymentTriggers: true,
        notificationRules: ['customer-impact', 'security-alerts']
      }
    });

    // Lightweight Template (DevPersonalHub)
    this.templates.set('lightweight', {
      id: 'lightweight',
      name: 'Lightweight Experimentation',
      description: 'Minimal template for rapid experimentation and learning projects',
      organizationType: 'experimental',
      settings: {
        public: true,
        securityLevel: 'medium',
        approvalRequired: false,
        autoDeployment: true
      },
      fields: [
        {
          name: 'Status',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'Idea', color: 'GRAY' },
            { name: 'In Progress', color: 'YELLOW' },
            { name: 'Testing', color: 'BLUE' },
            { name: 'Done', color: 'GREEN' },
            { name: 'Archived', color: 'PINK' }
          ]
        },
        {
          name: 'Type',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'Experiment', color: 'PURPLE' },
            { name: 'Learning', color: 'BLUE' },
            { name: 'Side Project', color: 'GREEN' },
            { name: 'Tool', color: 'ORANGE' }
          ]
        },
        {
          name: 'Technology',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'React', color: 'BLUE' },
            { name: 'Node.js', color: 'GREEN' },
            { name: 'Python', color: 'YELLOW' },
            { name: 'AI/ML', color: 'PURPLE' },
            { name: 'Design', color: 'PINK' },
            { name: 'Other', color: 'GRAY' }
          ]
        },
        {
          name: 'Effort',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'Quick', color: 'GREEN' },
            { name: 'Weekend', color: 'YELLOW' },
            { name: 'Week', color: 'ORANGE' },
            { name: 'Month+', color: 'RED' }
          ]
        }
      ],
      views: [
        {
          name: 'Experiment Board',
          layout: 'BOARD_LAYOUT',
          groupBy: 'Status',
          sortBy: 'Type'
        },
        {
          name: 'By Technology',
          layout: 'TABLE_LAYOUT',
          groupBy: 'Technology',
          sortBy: 'Effort'
        },
        {
          name: 'Learning Goals',
          layout: 'TABLE_LAYOUT',
          filterBy: 'Type:Learning'
        }
      ],
      workflows: ['quick-deploy', 'experiment-archive'],
      automationRules: {
        issueLabeling: true,
        projectRouting: true,
        deploymentTriggers: true,
        notificationRules: ['experiment-results']
      }
    });

    // Research-Focused Template (DevAcademicHub)
    this.templates.set('research-focused', {
      id: 'research-focused',
      name: 'Academic Research Project',
      description: 'Template optimized for academic research and coursework management',
      organizationType: 'research',
      settings: {
        public: false,
        securityLevel: 'medium',
        approvalRequired: true,
        autoDeployment: false
      },
      fields: [
        {
          name: 'Status',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'Planning', color: 'GRAY' },
            { name: 'Research', color: 'BLUE' },
            { name: 'Development', color: 'YELLOW' },
            { name: 'Analysis', color: 'ORANGE' },
            { name: 'Writing', color: 'PURPLE' },
            { name: 'Review', color: 'PINK' },
            { name: 'Complete', color: 'GREEN' }
          ]
        },
        {
          name: 'Course',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'CS101', color: 'BLUE' },
            { name: 'Data Science', color: 'GREEN' },
            { name: 'Machine Learning', color: 'PURPLE' },
            { name: 'Web Development', color: 'ORANGE' },
            { name: 'Thesis', color: 'RED' },
            { name: 'Independent', color: 'GRAY' }
          ]
        },
        {
          name: 'Research Area',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'Algorithms', color: 'BLUE' },
            { name: 'AI/ML', color: 'PURPLE' },
            { name: 'Web Development', color: 'GREEN' },
            { name: 'Data Analysis', color: 'ORANGE' },
            { name: 'Systems', color: 'RED' },
            { name: 'Theory', color: 'PINK' }
          ]
        },
        {
          name: 'Due Date',
          type: 'DATE'
        },
        {
          name: 'Grade Impact',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'Major', color: 'RED' },
            { name: 'Minor', color: 'ORANGE' },
            { name: 'Extra Credit', color: 'GREEN' }
          ]
        },
        {
          name: 'Progress',
          type: 'NUMBER'
        }
      ],
      views: [
        {
          name: 'Research Pipeline',
          layout: 'BOARD_LAYOUT',
          groupBy: 'Status',
          sortBy: 'Due Date'
        },
        {
          name: 'By Course',
          layout: 'TABLE_LAYOUT',
          groupBy: 'Course',
          sortBy: 'Due Date'
        },
        {
          name: 'Deadlines',
          layout: 'TABLE_LAYOUT',
          sortBy: 'Due Date'
        },
        {
          name: 'Research Areas',
          layout: 'TABLE_LAYOUT',
          groupBy: 'Research Area',
          sortBy: 'Progress'
        }
      ],
      workflows: ['peer-review', 'citation-validation', 'backup-research'],
      automationRules: {
        issueLabeling: true,
        projectRouting: true,
        deploymentTriggers: false,
        notificationRules: ['deadline-alerts', 'research-milestones']
      }
    });

    // Infrastructure Template (DevEcosystem)
    this.templates.set('infrastructure', {
      id: 'infrastructure',
      name: 'Infrastructure & DevOps',
      description: 'Template for infrastructure, automation, and cross-organization tools',
      organizationType: 'infrastructure',
      settings: {
        public: false,
        securityLevel: 'high',
        approvalRequired: true,
        autoDeployment: false
      },
      fields: [
        {
          name: 'Status',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'Planning', color: 'GRAY' },
            { name: 'Development', color: 'YELLOW' },
            { name: 'Testing', color: 'BLUE' },
            { name: 'Staging', color: 'ORANGE' },
            { name: 'Production', color: 'GREEN' },
            { name: 'Monitoring', color: 'PURPLE' }
          ]
        },
        {
          name: 'Impact Scope',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'Single Repo', color: 'GREEN' },
            { name: 'Organization', color: 'YELLOW' },
            { name: 'Cross-Org', color: 'ORANGE' },
            { name: 'Global', color: 'RED' }
          ]
        },
        {
          name: 'System Component',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'Automation', color: 'BLUE' },
            { name: 'Monitoring', color: 'PURPLE' },
            { name: 'CI/CD', color: 'GREEN' },
            { name: 'Security', color: 'RED' },
            { name: 'Analytics', color: 'ORANGE' }
          ]
        },
        {
          name: 'Risk Level',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'High', color: 'RED' },
            { name: 'Medium', color: 'ORANGE' },
            { name: 'Low', color: 'GREEN' }
          ]
        },
        {
          name: 'Rollback Plan',
          type: 'SINGLE_SELECT',
          options: [
            { name: 'Ready', color: 'GREEN' },
            { name: 'In Progress', color: 'YELLOW' },
            { name: 'Not Required', color: 'GRAY' }
          ]
        },
        {
          name: 'Assignee',
          type: 'ASSIGNEES'
        }
      ],
      views: [
        {
          name: 'Infrastructure Board',
          layout: 'BOARD_LAYOUT',
          groupBy: 'Status',
          sortBy: 'Risk Level'
        },
        {
          name: 'Impact Assessment',
          layout: 'TABLE_LAYOUT',
          groupBy: 'Impact Scope',
          sortBy: 'Risk Level'
        },
        {
          name: 'Risk Management',
          layout: 'TABLE_LAYOUT',
          groupBy: 'Risk Level',
          sortBy: 'System Component'
        },
        {
          name: 'System Components',
          layout: 'TABLE_LAYOUT',
          groupBy: 'System Component',
          sortBy: 'Status'
        }
      ],
      workflows: ['impact-analysis', 'staged-deployment', 'rollback-preparation'],
      automationRules: {
        issueLabeling: true,
        projectRouting: true,
        deploymentTriggers: false,
        notificationRules: ['infrastructure-alerts', 'cross-org-impacts']
      }
    });

    this.logger.info('Project templates loaded', { 
      templates: Array.from(this.templates.keys()) 
    });
  }

  /**
   * Generate project title from template and context
   * @param {Object} template - Template configuration
   * @param {Object} context - Application context
   * @returns {string} - Generated title
   * @private
   */
  _generateTitle(template, context) {
    if (context.repository && context.organization) {
      return `${context.repository} - ${context.organization}`;
    }
    return template.name;
  }

  /**
   * Generate project description from template and context
   * @param {Object} template - Template configuration
   * @param {Object} context - Application context
   * @returns {string} - Generated description
   * @private
   */
  _generateDescription(template, context) {
    const baseDescription = template.description;
    if (context.repository) {
      return `${baseDescription} - Managing ${context.repository} repository with DevFlow Orchestrator`;
    }
    return baseDescription;
  }

  /**
   * Generate project README from template and context
   * @param {Object} template - Template configuration
   * @param {Object} context - Application context
   * @returns {string} - Generated README
   * @private
   */
  _generateReadme(template, context) {
    return `# ${this._generateTitle(template, context)}

${this._generateDescription(template, context)}

## 🎯 Project Configuration

**Template**: ${template.name}  
**Organization Type**: ${template.organizationType}  
**Managed by**: DevFlow Orchestrator  

### 🔧 Project Fields
${template.fields.map(field => `- **${field.name}**: ${field.type}`).join('\n')}

### 📊 Project Views
${template.views.map(view => `- **${view.name}**: ${view.layout} grouped by ${view.groupBy || 'default'}`).join('\n')}

### 🚀 Automation
${template.workflows.map(workflow => `- ${workflow}`).join('\n')}

---
*Auto-generated by DevFlow Orchestrator Project Template Manager*  
*Template: ${template.id}*  
*Generated: ${new Date().toISOString()}*
`;
  }

  /**
   * Customize fields based on context
   * @param {Array} fields - Template fields
   * @param {Object} context - Application context
   * @returns {Array} - Customized fields
   * @private
   */
  _customizeFields(fields, context) {
    // For now, return fields as-is
    // TODO: Add context-specific field customization
    return fields.map(field => ({ ...field }));
  }

  /**
   * Customize views based on context
   * @param {Array} views - Template views
   * @param {Object} context - Application context
   * @returns {Array} - Customized views
   * @private
   */
  _customizeViews(views, context) {
    // For now, return views as-is
    // TODO: Add context-specific view customization
    return views.map(view => ({ ...view }));
  }
}

export default ProjectTemplateManager;