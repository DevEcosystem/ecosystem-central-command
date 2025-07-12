/**
 * Webhook Proxy for GitHub Organization Events
 * Forwards webhook events to GitHub Actions workflow dispatch
 */
const https = require('https');

// GitHub Personal Access Token from environment
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/**
 * Verify webhook signature
 */
function verifySignature(payload, signature, secret) {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}

/**
 * Trigger GitHub Actions workflow
 */
async function triggerWorkflow(eventType, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      event_type: eventType,
      client_payload: payload
    });

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: '/repos/DevEcosystem/ecosystem-central-command/dispatches',
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'Ecosystem-Webhook-Proxy',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 204) {
          resolve({ success: true, status: res.statusCode });
        } else {
          reject(new Error(`GitHub API returned ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Main webhook handler
 */
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw body for signature verification
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks).toString('utf8');
    const body = JSON.parse(rawBody);

    // Verify signature if secret is set
    if (WEBHOOK_SECRET) {
      const signature = req.headers['x-hub-signature-256'];
      if (!signature || !verifySignature(rawBody, signature, WEBHOOK_SECRET)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Get GitHub event type
    const githubEvent = req.headers['x-github-event'];
    console.log(`Received ${githubEvent} event`);

    // Determine action based on event
    let eventType = 'ecosystem-sync';
    let shouldTrigger = false;
    
    switch (githubEvent) {
      case 'repository':
        if (['created', 'deleted', 'archived', 'unarchived'].includes(body.action)) {
          eventType = `repository-${body.action}`;
          shouldTrigger = true;
        }
        break;
        
      case 'push':
        // Only trigger for main/master branch
        if (body.ref === 'refs/heads/main' || body.ref === 'refs/heads/master') {
          eventType = 'repository-updated';
          shouldTrigger = true;
        }
        break;
        
      case 'create':
      case 'delete':
        if (body.ref_type === 'repository') {
          eventType = `repository-${githubEvent}d`;
          shouldTrigger = true;
        }
        break;
    }

    if (shouldTrigger) {
      // Trigger GitHub Actions workflow
      await triggerWorkflow(eventType, {
        repository: body.repository?.name || 'unknown',
        organization: body.organization?.login || body.repository?.owner?.login || 'unknown',
        action: body.action || githubEvent,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        message: 'Workflow triggered successfully',
        event: eventType
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'Event received but no action needed',
        event: githubEvent
      });
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
};