# DirectoryJet 🚀

DirectoryJet automates the tedious, time-consuming process of submitting startups and SaaS products to over 50+ premium startup directories, launch platforms, and communities. We save solo founders and indie hackers 20+ hours of manual data entry while securing high-quality SEO backlinks and initial traffic.

This repository houses the complete, lightweight DirectoryJet prototype.

---

## 🏗️ Project Architecture & Stack

- **Frontend**: Vite + React, bundled with Lucide icons. Designed with a gorgeous modern dark-theme SaaS landing page, step-by-step rich submission form, mock Stripe payment checkout, and an interactive real-time progress dashboard.
- **Backend**: Node.js + Express REST API. Handles startup creation, payment simulation, and manual retries.
- **Database**: SQLite database stored at `/home/team/shared/directoryjet.db`. 
- **Submission Engine**: A standalone background script (`run_submissions.js`) spawned as a separate child process. It simulates actual browser form filling and submission by transitioning statuses and generating directory-specific live links over time.

---

## 🗃️ Database Schema

The SQLite database at `/home/team/shared/directoryjet.db` consists of two core tables:

### 1. `startups`
Holds detailed profile metadata supplied by the founder:
- `id` (TEXT PRIMARY KEY) - Generated UUID
- `name` (TEXT) - Startup Name
- `website_url` (TEXT) - Target website
- `tagline` (TEXT) - One-line product elevator pitch
- `description` (TEXT) - Long description of features/value props
- `keywords` (TEXT) - Comma-separated keywords
- `category` (TEXT) - Industry category
- `founder_name`, `founder_email`, `founder_twitter`, `founder_linkedin` (TEXT)
- `logo_url`, `screenshot_url` (TEXT) - Brand asset links
- `plan` (TEXT) - Choice of tier (`essential`, `premium`, `agency`)
- `payment_status` (TEXT) - Checkout state (`pending`, `paid`)
- `created_at`, `updated_at` (TEXT)

### 2. `submissions`
Holds directory-by-directory submission logs for each startup:
- `id` (TEXT PRIMARY KEY) - Generated UUID
- `startup_id` (TEXT) - Foreign Key to `startups(id)`
- `directory_name` (TEXT) - Name of directory (e.g. "Product Hunt", "BetaList")
- `directory_url` (TEXT) - Directory homepage
- `status` (TEXT) - Live state: `pending`, `submitting`, `submitted`, `approved` (completed/live), or `failed`
- `link` (TEXT) - Verified live directory listing link (populated when status is `approved`)
- `submission_date` (TEXT) - Datetime of transition
- `updated_at` (TEXT)

---

## ⚡ Quick Start & Run Instructions

Both the frontend built assets and backend APIs are hosted on a **single origin** on **port 3000** for optimal memory-light resource footprint and seamless CORS integration.

### 1. Build and Run the Platform

From the root directory:

```bash
# 1. Install frontend dependencies and build static assets
cd /code/directoryjet/frontend
npm install
npm run build

# 2. Install backend dependencies and start the port-3000 server in the background
cd /code/directoryjet/backend
npm install
nohup node server.js > /tmp/directoryjet_server.log 2>&1 &
```

Once started, the backend Express server will serve the built React frontend at `http://localhost:3000` (live on all interfaces `0.0.0.0`).

### 2. Monitor Background Worker Outputs

When a user completes the Sandbox Checkout, the Express server spawns the background submission engine. You can inspect real-time automation logs using:

```bash
tail -f /tmp/run_submissions.log
```

---

## 🔍 Features Checklist

- [x] **Highly Converting Landing Page**: Features clear pricing cards ($79, $149, $399/mo), value props, and Sandbox Mode banner warnings.
- [x] **Comprehensive Form**: Submits detailed brand details, logo images, categories, and founder credentials.
- [x] **Sandbox payment gateway simulator**: Safely mock a Stripe checkout flow to activate submissions instantly.
- [x] **Real-time Dashboard Polling**: Client-side component polls status every 2 seconds, displaying progress bars, statistics cards, and directory lists with dynamic status badges (`approved` / `submitted` / `failed` / `submitting` / `pending`).
- [x] **Retry Trigger**: Users can trigger manual retries on failed directories directly from the dashboard.
