/**
 * @fileoverview DevFlow Dashboard Server
 * @version 1.0.0
 * @author DevEcosystem
 * 
 * Web-based dashboard for managing GitHub Projects V2 across organizations
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import { ConfigManager } from '../config/config-manager.js';
import { ProjectAutomationService } from '../core/project-automation.js';
import { GitHubProjectsAPI } from '../api/github-projects.js';
import { IssueCompletionTracker } from '../core/issue-completion-tracker.js';
import { MilestoneCompletionTracker } from '../core/milestone-completion-tracker.js';
import { Logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * DevFlow Dashboard Server
 * Provides web interface for project management across organizations
 */
class DashboardServer {
  constructor(options = {}) {
    this.options = {
      port: options.port || process.env.PORT || 3000,
      host: options.host || 'localhost',
      environment: options.environment || process.env.NODE_ENV || 'development',
      ...options
    };
    
    this.app = express();
    this.logger = new Logger('DashboardServer');
    this.config = null;
    this.projectAutomation = null;
    this.githubAPI = null;
    this.completionTracker = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the dashboard server
   */
  async initialize() {
    try {
      this.logger.info('Initializing DevFlow Dashboard Server...', {
        port: this.options.port,
        environment: this.options.environment
      });

      // Initialize configuration
      await this._initializeConfiguration();
      
      // Initialize services
      await this._initializeServices();
      
      // Setup middleware
      this._setupMiddleware();
      
      // Setup routes
      this._setupRoutes();
      
      // Setup error handling
      this._setupErrorHandling();
      
      this.isInitialized = true;
      this.logger.info('Dashboard server initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize dashboard server', { error: error.message });
      throw error;
    }
  }

  /**
   * Start the dashboard server
   */
  async start() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.options.port, this.options.host, (error) => {
        if (error) {
          this.logger.error('Failed to start dashboard server', { error: error.message });
          reject(error);
        } else {
          this.logger.info('Dashboard server started successfully', {
            url: `http://${this.options.host}:${this.options.port}`,
            environment: this.options.environment
          });
          resolve(server);
        }
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        this.logger.info('Received SIGTERM, shutting down gracefully');
        server.close(() => {
          this.logger.info('Dashboard server stopped');
          process.exit(0);
        });
      });
    });
  }

  /**
   * Initialize configuration
   * @private
   */
  async _initializeConfiguration() {
    this.config = new ConfigManager({
      environment: this.options.environment,
      enableHotReload: false,
      validateOnLoad: true
    });
    
    await this.config.initialize();
    this.logger.info('Configuration initialized for dashboard');
  }

  /**
   * Initialize services
   * @private
   */
  async _initializeServices() {
    // Initialize GitHub Projects API
    this.githubAPI = new GitHubProjectsAPI({
      token: this.config.get('env.GITHUB_TOKEN')
    });

    // Initialize Project Automation Service
    this.projectAutomation = new ProjectAutomationService(this.config);

    // Initialize Issue Completion Tracker
    this.completionTracker = new IssueCompletionTracker({
      enableAnalytics: true,
      retentionDays: 90
    });
    
    this.logger.info('Dashboard services initialized');
  }

  /**
   * Setup Express middleware
   * @private
   */
  _setupMiddleware() {
    // CORS
    this.app.use(cors({
      origin: this.options.environment === 'development' 
        ? ['http://localhost:3000', 'http://localhost:3001']
        : [],
      credentials: true
    }));

    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    this.app.use('/static', express.static(join(__dirname, 'static')));

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.debug('Dashboard request', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  /**
   * Setup API routes
   * @private
   */
  _setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: this.options.environment
      });
    });

    // Dashboard home
    this.app.get('/', this._serveDashboard.bind(this));

    // API Routes
    this.app.get('/api/organizations', this._getOrganizations.bind(this));
    this.app.get('/api/organizations/:orgId/projects', this._getOrganizationProjects.bind(this));
    this.app.get('/api/projects/overview', this._getProjectsOverview.bind(this));
    this.app.post('/api/projects/create', this._createProject.bind(this));
    this.app.get('/api/analytics/summary', this._getAnalyticsSummary.bind(this));
    this.app.get('/api/analytics/issue-completions', this._getIssueCompletions.bind(this));
    this.app.get('/api/analytics/milestone-completions', this._getMilestoneCompletions.bind(this));
    this.app.get('/api/milestones/:orgId/:repoId', this._getMilestones.bind(this));
    this.app.post('/api/milestones/:orgId/:repoId/:milestoneNumber/check', this._checkMilestoneCompletion.bind(this));

    // Catch all for SPA
    this.app.get('*', this._serveDashboard.bind(this));
  }

  /**
   * Setup error handling
   * @private
   */
  _setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });

    // Error handler
    this.app.use((err, req, res, next) => {
      this.logger.error('Dashboard server error', {
        error: err.message,
        stack: err.stack,
        url: req.url
      });

      res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: this.options.environment === 'development' ? err.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Serve dashboard HTML
   * @private
   */
  async _serveDashboard(req, res) {
    try {
      res.sendFile(join(__dirname, 'static', 'index.html'));
    } catch (error) {
      res.status(500).json({ error: 'Failed to serve dashboard' });
    }
  }

  /**
   * Get organizations
   * @private
   */
  async _getOrganizations(req, res) {
    try {
      const organizations = this.config.get('organizations');
      const orgList = Object.entries(organizations).map(([id, config]) => ({
        id,
        name: config.name,
        type: config.type,
        description: config.description,
        projectCount: 0 // Will be populated by separate call
      }));

      res.json({
        organizations: orgList,
        total: orgList.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get organizations', { error: error.message });
      res.status(500).json({ error: 'Failed to get organizations' });
    }
  }

  /**
   * Get projects for specific organization
   * @private
   */
  async _getOrganizationProjects(req, res) {
    try {
      const { orgId } = req.params;
      
      // Get projects from GitHub API
      const projects = await this.githubAPI.getOrganizationProjects(orgId);
      
      res.json({
        organization: orgId,
        projects: projects || [],
        total: projects?.length || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get organization projects', { 
        orgId: req.params.orgId,
        error: error.message 
      });
      res.status(500).json({ error: 'Failed to get organization projects' });
    }
  }

  /**
   * Get projects overview across all organizations
   * @private
   */
  async _getProjectsOverview(req, res) {
    try {
      const organizations = Object.keys(this.config.get('organizations'));
      const overview = [];

      for (const orgId of organizations) {
        try {
          const projects = await this.githubAPI.getOrganizationProjects(orgId);
          overview.push({
            organization: orgId,
            projects: projects || [],
            projectCount: projects?.length || 0
          });
        } catch (error) {
          this.logger.warn('Failed to get projects for organization', { orgId, error: error.message });
          overview.push({
            organization: orgId,
            projects: [],
            projectCount: 0,
            error: error.message
          });
        }
      }

      const totalProjects = overview.reduce((sum, org) => sum + org.projectCount, 0);

      res.json({
        overview,
        summary: {
          totalOrganizations: organizations.length,
          totalProjects,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      this.logger.error('Failed to get projects overview', { error: error.message });
      res.status(500).json({ error: 'Failed to get projects overview' });
    }
  }

  /**
   * Create new project
   * @private
   */
  async _createProject(req, res) {
    try {
      const { repository, options = {} } = req.body;

      if (!repository || !repository.name || !repository.owner) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          message: 'Repository name and owner are required' 
        });
      }

      const result = await this.projectAutomation.createProjectForRepository(repository, options);

      this.logger.info('Project created via dashboard', {
        projectId: result.project.id,
        organization: result.organization,
        template: result.template
      });

      res.json({
        success: true,
        project: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to create project via dashboard', { error: error.message });
      res.status(500).json({ 
        error: 'Failed to create project',
        message: error.message 
      });
    }
  }

  /**
   * Get analytics summary
   * @private
   */
  async _getAnalyticsSummary(req, res) {
    try {
      const organizations = Object.keys(this.config.get('organizations'));
      const analytics = {
        organizations: organizations.length,
        totalProjects: 0,
        projectsByOrg: {},
        templates: {},
        createdToday: 0,
        timestamp: new Date().toISOString()
      };

      for (const orgId of organizations) {
        try {
          const projects = await this.githubAPI.getOrganizationProjects(orgId);
          const projectCount = projects?.length || 0;
          
          analytics.totalProjects += projectCount;
          analytics.projectsByOrg[orgId] = projectCount;
          
          // Count templates (would need enhanced API for real template data)
          const orgConfig = this.config.getOrganizationConfig(orgId);
          const template = orgConfig.settings.projectTemplate;
          analytics.templates[template] = (analytics.templates[template] || 0) + projectCount;
          
        } catch (error) {
          this.logger.warn('Failed to get analytics for organization', { orgId });
          analytics.projectsByOrg[orgId] = 0;
        }
      }

      res.json(analytics);
    } catch (error) {
      this.logger.error('Failed to get analytics summary', { error: error.message });
      res.status(500).json({ error: 'Failed to get analytics summary' });
    }
  }

  /**
   * Get issue completion analytics
   * @private
   */
  async _getIssueCompletions(req, res) {
    try {
      const { repository, timeRange, limit, format } = req.query;
      
      // Get completion statistics
      const stats = this.completionTracker.getCompletionStats({
        repository: repository || undefined,
        timeRange: timeRange ? parseInt(timeRange) : 30,
        includeMetrics: true
      });

      // Get recent completions
      const recentCompletions = this.completionTracker.getRecentCompletions(
        limit ? parseInt(limit) : 10
      );

      // Get dashboard metrics
      const dashboardMetrics = this.completionTracker.getDashboardMetrics();

      const response = {
        statistics: stats,
        recent: recentCompletions,
        dashboard: dashboardMetrics,
        filters: {
          repository: repository || 'all',
          timeRange: timeRange ? parseInt(timeRange) : 30,
          limit: limit ? parseInt(limit) : 10
        },
        timestamp: new Date().toISOString()
      };

      // Handle export format
      if (format === 'export') {
        const exportData = this.completionTracker.exportCompletions({
          format: 'object',
          repository: repository,
          timeRange: timeRange ? parseInt(timeRange) : 30
        });
        
        res.json(exportData);
        return;
      }

      res.json(response);

    } catch (error) {
      this.logger.error('Failed to get issue completions', { 
        error: error.message,
        query: req.query 
      });
      res.status(500).json({ 
        error: 'Failed to get issue completion analytics',
        message: error.message 
      });
    }
  }

  /**
   * Get milestone completion analytics
   * @private
   */
  async _getMilestoneCompletions(req, res) {
    try {
      const { timeRange, organization, format } = req.query;
      
      this.logger.info('Getting milestone completion analytics', {
        timeRange,
        organization,
        format
      });

      // Load milestone completion data from analytics files
      const analyticsPath = 'devflow-orchestrator/analytics';
      const fs = await import('fs/promises');
      const path = await import('path');
      
      let completionData = [];
      
      try {
        const files = await fs.readdir(analyticsPath);
        const milestoneFiles = files.filter(f => f.startsWith('milestone-completion-'));
        
        for (const file of milestoneFiles) {
          const filePath = path.join(analyticsPath, file);
          const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
          completionData.push(...data);
        }
      } catch (error) {
        this.logger.warn('No milestone analytics data found', { error: error.message });
      }

      // Filter by time range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (parseInt(timeRange) || 30));
      
      const filteredData = completionData.filter(item => 
        new Date(item.timestamp) >= cutoffDate
      );

      // Calculate metrics
      const metrics = {
        totalMilestonesChecked: filteredData.length,
        completedMilestones: filteredData.filter(m => m.actions.autoClosed).length,
        averageCompletionPercentage: filteredData.length > 0 
          ? filteredData.reduce((sum, m) => sum + m.metrics.completionPercentage, 0) / filteredData.length 
          : 0,
        milestonesInProgress: filteredData.filter(m => 
          m.metrics.completionPercentage > 0 && m.metrics.completionPercentage < 100
        ).length
      };

      const response = {
        metrics,
        milestones: filteredData.map(m => ({
          number: m.milestone.number,
          title: m.milestone.title,
          state: m.milestone.state,
          url: m.milestone.url,
          completion: m.metrics.completionPercentage,
          totalIssues: m.metrics.totalIssues,
          closedIssues: m.metrics.closedIssues,
          openIssues: m.metrics.openIssues,
          autoClosed: m.actions.autoClosed,
          timestamp: m.timestamp
        })),
        timeRange: {
          days: parseInt(timeRange) || 30,
          from: cutoffDate.toISOString(),
          to: new Date().toISOString()
        }
      };

      res.json(response);

    } catch (error) {
      this.logger.error('Failed to get milestone completions', { 
        error: error.message,
        query: req.query 
      });
      res.status(500).json({ 
        error: 'Failed to get milestone completion analytics',
        message: error.message 
      });
    }
  }

  /**
   * Get milestones for organization/repository
   * @private
   */
  async _getMilestones(req, res) {
    try {
      const { orgId, repoId } = req.params;
      const { state = 'open' } = req.query;

      this.logger.info('Getting milestones', { orgId, repoId, state });

      const apiClient = new GitHubProjectsAPI(this.config);
      const milestones = await apiClient.getMilestones(orgId, repoId, { state });

      res.json({
        organization: orgId,
        repository: repoId,
        milestones: milestones.map(m => ({
          number: m.number,
          title: m.title,
          state: m.state,
          openIssues: m.open_issues,
          closedIssues: m.closed_issues,
          totalIssues: m.open_issues + m.closed_issues,
          completionPercentage: m.open_issues + m.closed_issues > 0 
            ? (m.closed_issues / (m.open_issues + m.closed_issues)) * 100 
            : 0,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
          dueOn: m.due_on,
          url: m.html_url
        }))
      });

    } catch (error) {
      this.logger.error('Failed to get milestones', { 
        error: error.message,
        params: req.params 
      });
      res.status(500).json({ 
        error: 'Failed to get milestones',
        message: error.message 
      });
    }
  }

  /**
   * Check milestone completion status
   * @private
   */
  async _checkMilestoneCompletion(req, res) {
    try {
      const { orgId, repoId, milestoneNumber } = req.params;

      this.logger.info('Checking milestone completion', { 
        orgId, 
        repoId, 
        milestoneNumber 
      });

      // Create GitHub context for milestone tracker
      const context = {
        repo: {
          owner: orgId,
          repo: repoId
        }
      };

      const apiClient = new GitHubProjectsAPI(this.config);
      const github = apiClient.getGitHubClient();

      const tracker = new MilestoneCompletionTracker({
        github,
        context,
        enableAnalytics: true,
        enableAutoClose: false // Manual check, don't auto-close
      });

      const result = await tracker.checkMilestoneCompletion(parseInt(milestoneNumber));

      res.json({
        milestone: result.milestone,
        metrics: result.metrics,
        actions: result.actions,
        timestamp: result.timestamp
      });

    } catch (error) {
      this.logger.error('Failed to check milestone completion', { 
        error: error.message,
        params: req.params 
      });
      res.status(500).json({ 
        error: 'Failed to check milestone completion',
        message: error.message 
      });
    }
  }
}

export { DashboardServer };

// Export default instance
export default DashboardServer;