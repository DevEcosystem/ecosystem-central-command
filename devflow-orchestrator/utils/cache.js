/**
 * @fileoverview Caching utility for performance optimization
 * @version 1.0.0
 * @author DevEcosystem
 */

import NodeCache from 'node-cache';
import { Logger } from './logger.js';

/**
 * Intelligent caching layer for DevFlow Orchestrator
 * Manages caching of GitHub API responses and configuration data
 */
export class Cache {
  constructor(options = {}) {
    this.logger = new Logger('Cache');
    
    // Default cache settings
    const defaultOptions = {
      stdTTL: 300, // 5 minutes default TTL
      checkperiod: 60, // Check for expired keys every minute
      useClones: false, // Don't clone objects for performance
      deleteOnExpire: true,
      enableLegacyCallbacks: false
    };

    this.cache = new NodeCache({ ...defaultOptions, ...options });
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };

    // Set up event listeners
    this.cache.on('set', (key, value) => {
      this.stats.sets++;
      this.logger.debug('Cache set', { key, ttl: this.cache.getTtl(key) });
    });

    this.cache.on('del', (key) => {
      this.stats.deletes++;
      this.logger.debug('Cache delete', { key });
    });

    this.cache.on('expired', (key) => {
      this.logger.debug('Cache expired', { key });
    });

    this.logger.info('Cache initialized', { options: { ...defaultOptions, ...options } });
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {*} - Cached value or undefined
   */
  get(key) {
    const value = this.cache.get(key);
    
    if (value !== undefined) {
      this.stats.hits++;
      this.logger.debug('Cache hit', { key });
    } else {
      this.stats.misses++;
      this.logger.debug('Cache miss', { key });
    }

    return value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {boolean} - Success status
   */
  set(key, value, ttl) {
    const success = this.cache.set(key, value, ttl);
    
    if (success) {
      this.logger.debug('Cache set successful', { key, ttl });
    } else {
      this.logger.warn('Cache set failed', { key, ttl });
    }

    return success;
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {number} - Number of deleted entries
   */
  del(key) {
    const deleted = this.cache.del(key);
    this.logger.debug('Cache delete', { key, deleted });
    return deleted;
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} - Existence status
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    const cacheStats = this.cache.getStats();
    return {
      ...this.stats,
      keys: cacheStats.keys,
      ksize: cacheStats.ksize,
      vsize: cacheStats.vsize,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  /**
   * Clear all cache entries
   */
  flushAll() {
    this.cache.flushAll();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
    this.logger.info('Cache flushed');
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   * @param {string} key - Cache key
   * @param {Function} fn - Function to execute if cache miss
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<*>} - Cached or fresh value
   */
  async getOrSet(key, fn, ttl) {
    let value = this.get(key);
    
    if (value !== undefined) {
      return value;
    }

    try {
      this.logger.debug('Cache miss, executing function', { key });
      value = await fn();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      this.logger.error('Failed to execute function for cache', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Create cache key for GitHub API responses
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @returns {string} - Cache key
   */
  static createGitHubKey(endpoint, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `github:${endpoint}:${paramString}`;
  }

  /**
   * Create cache key for organization configuration
   * @param {string} organizationId - Organization identifier
   * @returns {string} - Cache key
   */
  static createOrgKey(organizationId) {
    return `org:${organizationId}:config`;
  }

  /**
   * Create cache key for project data
   * @param {string} projectId - Project identifier
   * @returns {string} - Cache key
   */
  static createProjectKey(projectId) {
    return `project:${projectId}:data`;
  }

  /**
   * Create cache key for organization projects
   * @param {string} organizationLogin - Organization login
   * @returns {string} - Cache key
   */
  static createOrgProjectsKey(organizationLogin) {
    return `org:${organizationLogin}:projects`;
  }

  /**
   * Create cache key for issue classification
   * @param {number} issueId - Issue identifier
   * @param {string} repository - Repository name
   * @returns {string} - Cache key
   */
  static createIssueKey(issueId, repository) {
    return `issue:${repository}:${issueId}:classification`;
  }
}

export default Cache;