/**
 * @fileoverview Structured logging utility
 * @version 1.0.0
 * @author DevEcosystem
 */

import winston from 'winston';

/**
 * Structured logger for DevFlow Orchestrator
 * Provides consistent logging across all components
 */
export class Logger {
  constructor(component) {
    this.component = component;
    this.winston = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { 
        service: 'devflow-orchestrator',
        component: this.component 
      },
      transports: [
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log' 
        })
      ]
    });

    // Add console transport in development
    if (process.env.NODE_ENV !== 'production') {
      this.winston.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
  }

  /**
   * Log info level message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    this.winston.info(message, { ...meta, component: this.component });
  }

  /**
   * Log warning level message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    this.winston.warn(message, { ...meta, component: this.component });
  }

  /**
   * Log error level message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    this.winston.error(message, { ...meta, component: this.component });
  }

  /**
   * Log debug level message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    this.winston.debug(message, { ...meta, component: this.component });
  }
}

export default Logger;