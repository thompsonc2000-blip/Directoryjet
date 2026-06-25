const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const crypto = require('crypto');
const { run, get, all } = require('./db');
const { DIRECTORIES } = require('./directories');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to make URL-friendly slug
function makeSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// API Routes

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', env: process.env.VERCEL ? 'vercel' : 'local' });
});

// 1. Get startup details
app.get('/api/submissions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const startup = await get('SELECT * FROM startups WHERE id = ?', [id]);
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }
    res.json(startup);
  } catch (error) {
    console.error('Error fetching startup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Get directory submissions status for a startup
app.get('/api/submissions/:id/status', async (req, res) => {
  const { id } = req.params;
  try {
    const startup = await get('SELECT id FROM startups WHERE id = ?', [id]);
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }
    const statuses = await all('SELECT * FROM submissions WHERE startup_id = ?', [id]);
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching submission statuses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Create a startup submission
app.post('/api/submissions', async (req, res) => {
  const {
    name,
    website_url,
    tagline,
    description,
    keywords,
    category,
    founder_name,
    founder_email,
    founder_twitter,
    founder_linkedin,
    logo_url,
    screenshot_url,
    plan // essential, premium, agency
  } = req.body;

  if (!name || !website_url || !founder_name || !founder_email) {
    return res.status(400).json({ error: 'Name, website URL, founder name, and founder email are required' });
  }

  const selectedPlan = plan || 'essential';
  const startupId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    // Insert startup
    await run(
      `INSERT INTO startups (
        id, name, website_url, tagline, description, keywords, category,
        founder_name, founder_email, founder_twitter, founder_linkedin,
        logo_url, screenshot_url, plan, payment_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        startupId,
        name,
        website_url,
        tagline || '',
        description || '',
        keywords || '',
        category || 'SaaS',
        founder_name,
        founder_email,
        founder_twitter || '',
        founder_linkedin || '',
        logo_url || '',
        screenshot_url || '',
        selectedPlan,
        'pending', // initially pending payment
        now,
        now
      ]
    );

    // Determine which directories to populate based on plan
    // Essential = 20 directories, Premium/Agency = all 54 directories
    const count = selectedPlan === 'essential' ? 20 : DIRECTORIES.length;
    const targetDirs = DIRECTORIES.slice(0, count);

    for (const dir of targetDirs) {
      const subId = crypto.randomUUID();
      await run(
        `INSERT INTO submissions (
          id, startup_id, directory_name, directory_url, status, link, submission_date, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          subId,
          startupId,
          dir.name,
          dir.url,
          'pending',
          null,
          null,
          now
        ]
      );
    }

    const createdStartup = await get('SELECT * FROM startups WHERE id = ?', [startupId]);
    res.status(201).json(createdStartup);
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Simulate payment completion (Legacy mock checkout, still available)
app.post('/api/submissions/:id/pay', async (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();

  try {
    const startup = await get('SELECT * FROM startups WHERE id = ?', [id]);
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    // Update payment status
    await run(
      'UPDATE startups SET payment_status = ?, updated_at = ? WHERE id = ?',
      ['paid', now, id]
    );

    console.log(`Payment completed for startup ${id}. Launching background submission simulation...`);

    // Trigger submission background process
    triggerBackgroundSubmissions(id);

    res.json({ success: true, message: 'Payment simulated successfully. Submissions started in background.' });
  } catch (error) {
    console.error('Error simulating payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4b. Submit payment for admin review (PayPal.Me flow)
app.post('/api/submissions/:id/submit-payment', async (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();

  try {
    const startup = await get('SELECT * FROM startups WHERE id = ?', [id]);
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    await run(
      'UPDATE startups SET payment_status = ?, updated_at = ? WHERE id = ?',
      ['submitted_for_review', now, id]
    );

    res.json({ success: true, message: 'Payment submitted for review.' });
  } catch (error) {
    console.error('Error submitting payment for review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4c. Admin verify payment and trigger submissions
app.post('/api/submissions/:id/verify-payment', async (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();

  try {
    const startup = await get('SELECT * FROM startups WHERE id = ?', [id]);
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    await run(
      'UPDATE startups SET payment_status = ?, updated_at = ? WHERE id = ?',
      ['paid', now, id]
    );

    triggerBackgroundSubmissions(id);

    res.json({ success: true, message: 'Payment verified. Submissions started in background.' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4d. Get all startups for Admin Dashboard
app.get('/api/admin/submissions', async (req, res) => {
  try {
    const startups = await all('SELECT * FROM startups ORDER BY created_at DESC');
    res.json(startups);
  } catch (error) {
    console.error('Error fetching admin submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Trigger submissions manually / retry
app.post('/api/submissions/:id/trigger', async (req, res) => {
  const { id } = req.params;

  try {
    const startup = await get('SELECT * FROM startups WHERE id = ?', [id]);
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    if (startup.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment required before triggering submissions' });
    }

    // Reset failed back to pending so they can be processed again
    await run(
      "UPDATE submissions SET status = 'pending' WHERE startup_id = ? AND status = 'failed'",
      [id]
    );

    triggerBackgroundSubmissions(id);

    res.json({ success: true, message: 'Submission process triggered.' });
  } catch (error) {
    console.error('Error triggering submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Background script helper
function triggerBackgroundSubmissions(id) {
  const scriptPath = path.join(__dirname, 'run_submissions.js');
  const logFile = '/tmp/run_submissions.log';
  const out = fs.openSync(logFile, 'a');
  const err = fs.openSync(logFile, 'a');

  console.log(`Spawning background worker for startup ${id}...`);
  const child = spawn('node', [scriptPath, id], {
    detached: true,
    stdio: ['ignore', out, err]
  });

  child.unref(); // Allow the parent Express process to exit independently of this child
}

// Serve Frontend Static Files in production/any-state
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  
  // Custom middleware fallback for SPA routing
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
    next();
  });
} else {
  // Helpful fall-back message if frontend isn't built yet
  app.get('/', (req, res) => {
    res.send('DirectoryJet API Server is running. Frontend build not found. Please build the frontend React application.');
  });
}

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[${new Date().toISOString()}] Server listening on port ${PORT} bound to 0.0.0.0`);
  });
}

module.exports = app;
