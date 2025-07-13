/**
 * @fileoverview Rate Limiter for GitHub API calls
 * @version 1.0.0
 * @author DevEcosystem
 */

import { Logger } from './logger.js';

/**
 * Rate limiter for GitHub API requests
 * Implements intelligent rate limiting with exponential backoff
 */
export class RateLimiter {
  constructor(options = {}) {
    this.logger = new Logger('RateLimiter');
    
    // Configuration
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 30000; // 30 seconds
    this.rateLimitBuffer = options.rateLimitBuffer || 100; // Keep 100 requests in reserve
    
    // State tracking
    this.requestCount = 0;
    this.rateLimitRemaining = 5000; // GitHub default
    this.rateLimitReset = null;
    this.isRateLimited = false;
    
    this.logger.info('Rate Limiter initialized', {
      maxRetries: this.maxRetries,
      baseDelay: this.baseDelay,
      buffer: this.rateLimitBuffer
    });
  }

  /**
   * Execute a function with rate limiting
   * @param {Function} fn - Function to execute
   * @param {Object} context - Execution context for logging
   * @returns {Promise} - Function result
   */
  async execute(fn, context = {}) {
    let attempt = 0;
    let lastError = null;

    while (attempt <= this.maxRetries) {
      try {
        // Check rate limit before executing
        await this._checkRateLimit();
        
        this.logger.debug('Executing rate-limited function', {
          attempt: attempt + 1,
          remaining: this.rateLimitRemaining,
          ...context
        });

        // Execute the function
        const result = await fn();
        
        // Update rate limit info if available in response
        this._updateRateLimitInfo(result);
        
        this.requestCount++;
        return result;

      } catch (error) {
        lastError = error;
        attempt++;

        this.logger.warn('Rate-limited function failed', {
          attempt,
          error: error.message,
          ...context
        });

        // Check if this is a rate limit error
        if (this._isRateLimitError(error)) {
          this.isRateLimited = true;
          this._extractRateLimitInfo(error);
          
          if (attempt <= this.maxRetries) {
            const delay = this._calculateBackoffDelay(attempt);
            this.logger.info('Rate limited, backing off', {
              attempt,
              delay,
              resetTime: this.rateLimitReset
            });
            await this._delay(delay);
            continue;
          }
        }

        // Check if this is a retryable error
        if (!this._isRetryableError(error) || attempt > this.maxRetries) {
          break;
        }

        // Apply exponential backoff for retryable errors
        const delay = this._calculateBackoffDelay(attempt);
        this.logger.info('Retrying after backoff', { attempt, delay });
        await this._delay(delay);
      }
    }

    // All retries exhausted
    this.logger.error('Rate-limited function failed after all retries', {
      attempts: attempt,
      error: lastError?.message,
      ...context
    });

    throw lastError;
  }

  /**
   * Update rate limit information from response
   * @param {Object} response - API response
   */
  updateRateLimitInfo(response) {
    this._updateRateLimitInfo(response);
  }

  /**
   * Get current rate limit status
   * @returns {Object} - Rate limit status
   */
  getStatus() {
    return {
      requestCount: this.requestCount,
      rateLimitRemaining: this.rateLimitRemaining,
      rateLimitReset: this.rateLimitReset,
      isRateLimited: this.isRateLimited,
      timeUntilReset: this.rateLimitReset ? 
        Math.max(0, this.rateLimitReset - Date.now()) : null
    };
  }

  /**
   * Check if we should wait before making request
   * @private
   */
  async _checkRateLimit() {
    // If we have rate limit info and we're close to the limit
    if (this.rateLimitRemaining <= this.rateLimitBuffer) {
      const timeUntilReset = this.rateLimitReset - Date.now();
      
      if (timeUntilReset > 0) {
        this.logger.warn('Approaching rate limit, waiting for reset', {
          remaining: this.rateLimitRemaining,
          resetIn: timeUntilReset
        });
        
        await this._delay(Math.min(timeUntilReset + 1000, this.maxDelay));
        this.isRateLimited = false;
      }
    }
  }

  /**
   * Update rate limit information from response
   * @param {Object} response - API response
   * @private
   */
  _updateRateLimitInfo(response) {
    // Extract rate limit info from GraphQL response
    if (response?.extensions?.cost) {
      // GitHub GraphQL API cost information
      this.requestCount++;
    }

    // Extract from REST API headers (if available)
    if (response?.headers) {
      const remaining = response.headers['x-ratelimit-remaining'];
      const reset = response.headers['x-ratelimit-reset'];
      
      if (remaining !== undefined) {
        this.rateLimitRemaining = parseInt(remaining, 10);
      }
      
      if (reset !== undefined) {
        this.rateLimitReset = parseInt(reset, 10) * 1000; // Convert to milliseconds
      }
    }

    // Reset rate limited flag if we have remaining requests
    if (this.rateLimitRemaining > this.rateLimitBuffer) {
      this.isRateLimited = false;
    }
  }

  /**
   * Extract rate limit info from error
   * @param {Error} error - API error
   * @private
   */
  _extractRateLimitInfo(error) {
    // Extract from error response if available
    if (error.response?.headers) {
      const remaining = error.response.headers['x-ratelimit-remaining'];
      const reset = error.response.headers['x-ratelimit-reset'];
      
      if (remaining !== undefined) {
        this.rateLimitRemaining = parseInt(remaining, 10);
      }
      
      if (reset !== undefined) {
        this.rateLimitReset = parseInt(reset, 10) * 1000;
      }
    }

    // Check for GraphQL rate limit error
    if (error.errors) {
      const rateLimitError = error.errors.find(e => 
        e.type === 'RATE_LIMITED' || e.message?.includes('rate limit')
      );
      
      if (rateLimitError) {
        this.rateLimitRemaining = 0;
        // Estimate reset time if not provided
        if (!this.rateLimitReset) {
          this.rateLimitReset = Date.now() + (60 * 60 * 1000); // 1 hour
        }
      }
    }
  }

  /**
   * Check if error is due to rate limiting
   * @param {Error} error - Error to check
   * @returns {boolean} - True if rate limit error
   * @private
   */
  _isRateLimitError(error) {
    // HTTP 429 Too Many Requests
    if (error.status === 429) {
      return true;
    }

    // GraphQL rate limit error
    if (error.errors) {
      return error.errors.some(e => 
        e.type === 'RATE_LIMITED' || 
        e.message?.toLowerCase().includes('rate limit')
      );
    }

    // Check error message
    const message = error.message?.toLowerCase() || '';
    return message.includes('rate limit') || 
           message.includes('too many requests') ||
           message.includes('abuse detection');
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} - True if retryable
   * @private
   */
  _isRetryableError(error) {
    // Rate limit errors are retryable
    if (this._isRateLimitError(error)) {
      return true;
    }

    // Network errors are retryable
    if (error.code === 'ECONNRESET' || 
        error.code === 'ENOTFOUND' || 
        error.code === 'ETIMEDOUT') {
      return true;
    }

    // 5xx server errors are retryable
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // 4xx client errors are generally not retryable (except 429)
    return false;
  }

  /**
   * Calculate exponential backoff delay
   * @param {number} attempt - Attempt number (1-based)
   * @returns {number} - Delay in milliseconds
   * @private
   */
  _calculateBackoffDelay(attempt) {
    // Exponential backoff with jitter
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    const delay = exponentialDelay + jitter;
    
    return Math.min(delay, this.maxDelay);
  }

  /**
   * Delay execution for specified milliseconds
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} - Promise that resolves after delay
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default RateLimiter;