/**
 * @fileoverview DevFlow Dashboard Application Entry Point
 * @version 1.0.0
 * @author DevEcosystem
 */

import dotenv from 'dotenv';
import { DashboardServer } from './server.js';
import { Logger } from '../utils/logger.js';

// Load environment variables
dotenv.config({ path: '../.env.local' });
dotenv.config({ path: '.env.local' });

const logger = new Logger('DashboardApp');

/**
 * Start the DevFlow Dashboard
 */
async function startDashboard() {
  try {
    logger.info('Starting DevFlow Dashboard...');

    const dashboard = new DashboardServer({
      port: process.env.DASHBOARD_PORT || 3000,
      host: process.env.DASHBOARD_HOST || 'localhost',
      environment: process.env.NODE_ENV || 'development'
    });

    const server = await dashboard.start();

    logger.info('Dashboard started successfully', {
      port: dashboard.options.port,
      host: dashboard.options.host,
      url: `http://${dashboard.options.host}:${dashboard.options.port}`
    });

    console.log(`
🚀 DevFlow Orchestrator Dashboard Started!

📊 Dashboard URL: http://${dashboard.options.host}:${dashboard.options.port}
🔧 Environment: ${dashboard.options.environment}
📋 Health Check: http://${dashboard.options.host}:${dashboard.options.port}/health

Features available:
✅ Organization overview across 4 organizations
✅ Real-time project monitoring  
✅ Project creation interface
✅ Cross-organization analytics

Press Ctrl+C to stop the dashboard
`);

  } catch (error) {
    logger.error('Failed to start dashboard', { error: error.message });
    console.error('❌ Failed to start DevFlow Dashboard:', error.message);
    process.exit(1);
  }
}

// Handle process signals
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Start the dashboard
startDashboard();