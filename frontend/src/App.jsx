import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Search,
  ArrowRight,
  Shield,
  Activity,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  Mail,
  User,
  Image,
  Tag,
  Link2,
  RefreshCw,
  Plus
} from 'lucide-react';

const Twitter = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Linkedin = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const API_BASE = ''; // Work seamlessly relative to server

export default function App() {
  const [view, setView] = useState('landing'); // landing, submit, checkout, dashboard
  const [searchId, setSearchId] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Form states
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    tagline: '',
    description: '',
    keywords: '',
    category: 'SaaS',
    founder_name: '',
    founder_email: '',
    founder_twitter: '',
    founder_linkedin: '',
    logo_url: '',
    screenshot_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Active Startup details for dashboard
  const [currentStartup, setCurrentStartup] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll for dashboard updates
  useEffect(() => {
    let intervalId;
    if (view === 'dashboard' && currentStartup) {
      const activeJobs = submissions.some(
        (sub) => sub.status === 'pending' || sub.status === 'submitting' || sub.status === 'submitted'
      );

      if (activeJobs && currentStartup.payment_status === 'paid') {
        intervalId = setInterval(() => {
          fetchDashboardData(currentStartup.id, false);
        }, 2000);
      }
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [view, currentStartup, submissions]);

  // Fetch data helper
  const fetchDashboardData = async (id, showSpinner = true) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      // Fetch startup details
      const startupRes = await fetch(`${API_BASE}/api/submissions/${id}`);
      if (!startupRes.ok) {
        throw new Error('Startup not found');
      }
      const startupData = await startupRes.json();
      setCurrentStartup(startupData);

      // Fetch submission statuses
      const statusRes = await fetch(`${API_BASE}/api/submissions/${id}/status`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSubmissions(statusData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setSearchError('Could not locate dashboard for this ID.');
    } finally {
      if (showSpinner) setIsRefreshing(false);
    }
  };

  // Search existing dashboard
  const handleSearchDashboard = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setIsSearching(true);
    setSearchError('');
    try {
      const startupRes = await fetch(`${API_BASE}/api/submissions/${searchId.trim()}`);
      if (!startupRes.ok) {
        throw new Error('Not found');
      }
      const startupData = await startupRes.json();
      setCurrentStartup(startupData);

      const statusRes = await fetch(`${API_BASE}/api/submissions/${searchId.trim()}/status`);
      const statusData = await statusRes.json();
      setSubmissions(statusData);

      setView('dashboard');
    } catch (err) {
      setSearchError('Invalid Startup ID. Please double check and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Submit Startup Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.website_url || !formData.founder_name || !formData.founder_email) {
      setFormError('Please fill in all required fields (Name, Website, Founder Name, Email).');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, plan: selectedPlan })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Submission failed');
      }

      const startupData = await response.json();
      setCurrentStartup(startupData);
      setView('checkout');
    } catch (err) {
      setFormError(err.message || 'An error occurred during submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate payment
  const handleSimulatePayment = async () => {
    if (!currentStartup) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/submissions/${currentStartup.id}/pay`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Payment simulation failed');
      }

      await fetchDashboardData(currentStartup.id, true);
      setView('dashboard');
    } catch (err) {
      alert('Simulation error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual Trigger
  const handleManualTrigger = async () => {
    if (!currentStartup) return;
    setIsRefreshing(true);
    try {
      await fetch(`${API_BASE}/api/submissions/${currentStartup.id}/trigger`, {
        method: 'POST'
      });
      await fetchDashboardData(currentStartup.id, false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate statistics for dashboard
  const getProgressStats = () => {
    if (!submissions.length) return { percent: 0, completed: 0, submitted: 0, active: 0, total: 0 };
    const total = submissions.length;
    const completed = submissions.filter((s) => s.status === 'approved').length;
    const submitted = submissions.filter((s) => s.status === 'submitted').length;
    const active = submissions.filter((s) => s.status === 'submitting').length;
    const percent = Math.round(((completed + submitted * 0.5) / total) * 100);
    return { percent, completed, submitted, active, total };
  };

  const stats = getProgressStats();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)' }}>
      {/* Navigation Header */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(22, 23, 29, 0.8)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setView('landing')}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
            <Rocket style={{ color: '#fff', width: '22px', height: '22px' }} />
          </div>
          <span style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-h)', letterSpacing: '-0.5px' }}>
            Directory<span style={{ color: 'var(--accent)' }}>Jet</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {view !== 'landing' && (
            <button
              onClick={() => setView('landing')}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text)', fontSize: '14px', fontWeight: '500' }}
            >
              Home
            </button>
          )}
          <button
            onClick={() => setView('submit')}
            style={{ padding: '8px 16px', background: 'linear-gradient(to right, var(--accent), #8b5cf6)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#fff', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(170, 59, 255, 0.25)' }}
          >
            <Plus style={{ width: '16px', height: '16px' }} /> Submit Startup
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ padding: '40px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* VIEW 1: LANDING */}
        {view === 'landing' && (
          <div style={{ textAlign: 'left' }}>
            {/* Hero Section */}
            <div style={{ textAlign: 'center', marginBottom: '64px', marginTop: '24px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', padding: '6px 16px', borderRadius: '99px', marginBottom: '24px' }}>
                <Sparkles style={{ width: '16px', height: '16px', color: 'var(--accent)' }} />
                <span style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: '600' }}>100% Automated Submissions</span>
              </div>
              
              <h1 style={{ marginBottom: '16px', lineHeight: '1.1' }}>
                Get Listed on <span style={{ background: 'linear-gradient(to right, var(--accent), #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>50+ High-Traffic</span> Startup Directories
              </h1>
              
              <p style={{ fontSize: '20px', maxWidth: '750px', margin: '0 auto 32px', color: 'var(--text)' }}>
                Automate 20+ hours of tedious manual data entry. Submit once to instantly secure organic backlinks, domain authority, and early traffic from the web's premium directories.
              </p>

              {/* Action Buttons & Access Code Search */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setSelectedPlan('premium');
                      setView('submit');
                    }}
                    style={{ padding: '14px 28px', background: 'linear-gradient(to right, var(--accent), #8b5cf6)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(170, 59, 255, 0.3)' }}
                  >
                    Submit Your Startup Now <ArrowRight style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>

                {/* Dashboard Access Search Box */}
                <form onSubmit={handleSearchDashboard} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '500px', marginTop: '16px', boxShadow: 'var(--shadow)' }}>
                  <Search style={{ width: '20px', height: '20px', color: 'var(--text)' }} />
                  <input
                    type="text"
                    placeholder="Enter existing Startup ID to track progress..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    style={{ background: 'transparent', border: 'none', flex: 1, color: 'var(--text-h)', outline: 'none', fontSize: '15px' }}
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    style={{ padding: '8px 16px', background: 'var(--border)', border: 'none', borderRadius: '6px', color: 'var(--text-h)', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isSearching ? <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} /> : 'Track'}
                  </button>
                </form>
                {searchError && (
                  <p style={{ color: '#ef4444', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle style={{ width: '16px', height: '16px' }} /> {searchError}
                  </p>
                )}
              </div>
            </div>

            {/* Core Value Props */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '64px' }}>
              <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '24px', borderRadius: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(170, 59, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Rocket style={{ color: 'var(--accent)', width: '22px', height: '22px' }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '8px' }}>Rapid Automation</h3>
                <p style={{ fontSize: '15px', color: 'var(--text)' }}>
                  Our advanced backend automates directory listings, form filling, and verification. No manual overhead.
                </p>
              </div>

              <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '24px', borderRadius: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(170, 59, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Activity style={{ color: 'var(--accent)', width: '22px', height: '22px' }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '8px' }}>Live Progress Tracking</h3>
                <p style={{ fontSize: '15px', color: 'var(--text)' }}>
                  Watch listings go live in real-time. Transparent tracking dashboard for all submitted platforms.
                </p>
              </div>

              <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', padding: '24px', borderRadius: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(170, 59, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Shield style={{ color: 'var(--accent)', width: '22px', height: '22px' }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '8px' }}>SEO Power Backlinks</h3>
                <p style={{ fontSize: '15px', color: 'var(--text)' }}>
                  Every successful listing generates a highly indexable backlink to skyrocket your domain authority.
                </p>
              </div>
            </div>

            {/* Pricing Tiers Section */}
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2 style={{ fontSize: '32px', marginBottom: '12px' }}>Simple, transparent pricing</h2>
              <p style={{ fontSize: '17px', color: 'var(--text)', marginBottom: '32px' }}>No hidden fees. Choose the tier that matches your startup's growth pace.</p>

              {/* Pricing cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
                {/* Tier 1: Essential */}
                <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px 24px', display: 'flex', flexDirection: 'column', textAlign: 'left', position: 'relative' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-h)', marginBottom: '8px' }}>Essential Jet</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text)', height: '40px', marginBottom: '16px' }}>Perfect for solo developers testing initial traction.</p>
                  <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-h)', marginBottom: '24px' }}>
                    $79 <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text)' }}>one-time</span>
                  </div>
                  <ul style={{ paddingLeft: '20px', fontSize: '15px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, marginBottom: '32px' }}>
                    <li>Automated submission to <strong>20 core directories</strong></li>
                    <li>Live real-time tracking dashboard</li>
                    <li>SEO backlinks & initial listing proofs</li>
                    <li style={{ color: 'var(--text)', textDecoration: 'line-through', opacity: 0.5 }}>Tailored AI tags & descriptions</li>
                    <li style={{ color: 'var(--text)', textDecoration: 'line-through', opacity: 0.5 }}>Agency submissions (multiple startups)</li>
                  </ul>
                  <button
                    onClick={() => {
                      setSelectedPlan('essential');
                      setView('submit');
                    }}
                    style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    Select Essential Jet
                  </button>
                </div>

                {/* Tier 2: Premium (Most popular) */}
                <div style={{ background: 'var(--code-bg)', border: '2px solid var(--accent)', borderRadius: '12px', padding: '32px 24px', display: 'flex', flexDirection: 'column', textAlign: 'left', position: 'relative', boxShadow: '0 8px 30px rgba(170, 59, 255, 0.15)' }}>
                  <div style={{ position: 'absolute', top: '-14px', right: '20px', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Best Seller
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-h)', marginBottom: '8px' }}>Premium Jet</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text)', height: '40px', marginBottom: '16px' }}>For indie founders looking for maximum SEO boost and premium listings.</p>
                  <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-h)', marginBottom: '24px' }}>
                    $149 <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text)' }}>one-time</span>
                  </div>
                  <ul style={{ paddingLeft: '20px', fontSize: '15px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, marginBottom: '32px' }}>
                    <li>Automated submission to <strong>50+ premium directories</strong></li>
                    <li>Tailored AI-generated tags & descriptions</li>
                    <li>Instant listing proofs & live check links</li>
                    <li>Priority submission speed queue</li>
                    <li>Lifetime update tracking</li>
                  </ul>
                  <button
                    onClick={() => {
                      setSelectedPlan('premium');
                      setView('submit');
                    }}
                    style={{ width: '100%', padding: '12px', background: 'linear-gradient(to right, var(--accent), #8b5cf6)', border: 'none', color: '#fff', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(170, 59, 255, 0.3)' }}
                  >
                    Select Premium Jet
                  </button>
                </div>

                {/* Tier 3: Agency */}
                <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px 24px', display: 'flex', flexDirection: 'column', textAlign: 'left', position: 'relative' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-h)', marginBottom: '8px' }}>Agency Jet</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text)', height: '40px', marginBottom: '16px' }}>Designed for startup studios and digital marketing agencies.</p>
                  <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-h)', marginBottom: '24px' }}>
                    $399 <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text)' }}>/ mo</span>
                  </div>
                  <ul style={{ paddingLeft: '20px', fontSize: '15px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, marginBottom: '32px' }}>
                    <li>Unlimited submissions (up to 5 startups/mo)</li>
                    <li>Automated submission to all <strong>50+ directories</strong></li>
                    <li>AI customization for description tailoring</li>
                    <li>White-label dashboard access for clients</li>
                    <li>Dedicated account manager & 1-on-1 support</li>
                  </ul>
                  <button
                    onClick={() => {
                      setSelectedPlan('agency');
                      setView('submit');
                    }}
                    style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    Select Agency Jet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SUBMISSION FORM */}
        {view === 'submit' && (
          <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', textAlign: 'left', boxShadow: 'var(--shadow)' }}>
            <h2 style={{ fontSize: '28px', color: 'var(--text-h)', marginBottom: '8px' }}>Submit Your Startup</h2>
            <p style={{ color: 'var(--text)', marginBottom: '24px' }}>Please supply detailed information about your software/startup. Our automated agents use these parameters to register listings.</p>

            {formError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '16px', borderRadius: '8px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <AlertCircle />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              {/* Plan Choice Info (Visual Banner) */}
              <div style={{ padding: '12px 16px', background: 'var(--accent-bg)', borderLeft: '4px solid var(--accent)', borderRadius: '0 6px 6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <span style={{ fontSize: '13px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--accent)' }}>Selected Tier</span>
                  <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)', textTransform: 'capitalize' }}>
                    {selectedPlan === 'essential' ? 'Essential Jet ($79 - 20 Directories)' : selectedPlan === 'premium' ? 'Premium Jet ($149 - 50+ Directories)' : 'Agency Jet ($399/mo - 50+ Directories, Bulk)'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setView('landing')}
                  style={{ fontSize: '13px', background: 'transparent', border: 'none', color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontWeight: '600' }}
                >
                  Change Plan
                </button>
              </div>

              {/* Section 1: Product Basics */}
              <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--text-h)' }}>1. Startup Overview</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '6px' }}>Startup Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px' }}>
                    <Rocket style={{ width: '18px', height: '18px', opacity: 0.5 }} />
                    <input
                      type="text"
                      placeholder="My Awesome SaaS"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ background: 'transparent', border: 'none', flex: 1, outline: 'none', color: 'var(--text-h)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '6px' }}>Website URL <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px' }}>
                    <Globe style={{ width: '18px', height: '18px', opacity: 0.5 }} />
                    <input
                      type="url"
                      placeholder="https://mysaas.com"
                      required
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      style={{ background: 'transparent', border: 'none', flex: 1, outline: 'none', color: 'var(--text-h)' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '6px' }}>One-line Tagline <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px' }}>
                  <Tag style={{ width: '18px', height: '18px', opacity: 0.5 }} />
                  <input
                    type="text"
                    placeholder="Automate SaaS submissions to top networks inside seconds."
                    required
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    style={{ background: 'transparent', border: 'none', flex: 1, outline: 'none', color: 'var(--text-h)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '6px' }}>Long Description <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea
                  placeholder="Provide an engaging overview of your product, features, integrations, and unique value propositions..."
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', outline: 'none', color: 'var(--text-h)', fontSize: '15px', fontFamily: 'var(--sans)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '6px' }}>Keywords (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="marketing, backend, automated tools, SaaS"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '11px 14px', outline: 'none', color: 'var(--text-h)', fontSize: '15px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '6px' }}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '11px 14px', outline: 'none', color: 'var(--text-h)', fontSize: '15px', height: '44px' }}
                  >
                    <option value="SaaS">SaaS & Cloud Web Apps</option>
                    <option value="Developer Tools">Developer Tools</option>
                    <option value="AI / ML Tool">Artificial Intelligence & AI Tools</option>
                    <option value="Marketing Automation">Marketing & SEO Automation</option>
                    <option value="No-Code Platform">No-Code Tools</option>
                    <option value="Mobile App">iOS & Android Apps</option>
                    <option value="Community / Education">Education & Community Hubs</option>
                  </select>
                </div>
              </div>

              {/* Section 2: Founder Details */}
              <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--text-h)' }}>2. Founder Profiles</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '6px' }}>Founder Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px' }}>
                    <User style={{ width: '18px', height: '18px', opacity: 0.5 }} />
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      required
                      value={formData.founder_name}
                      onChange={(e) => setFormData({ ...formData, founder_name: e.target.value })}
                      style={{ background: 'transparent', border: 'none', flex: 1, outline: 'none', color: 'var(--text-h)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '6px' }}>Contact Email <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px' }}>
                    <Mail style={{ width: '18px', height: '18px', opacity: 0.5 }} />
                    <input
                      type="email"
                      placeholder="jane@mysaas.com"
                      required
                      value={formData.founder_email}
                      onChange={(e) => setFormData({ ...formData, founder_email: e.target.value })}
                      style={{ background: 'transparent', border: 'none', flex: 1, outline: 'none', color: 'var(--text-h)' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '6px' }}>Founder Twitter/X (optional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px' }}>
                    <Twitter style={{ width: '18px', height: '18px', opacity: 0.5 }} />
                    <input
                      type="text"
                      placeholder="https://x.com/janedoe"
                      value={formData.founder_twitter}
                      onChange={(e) => setFormData({ ...formData, founder_twitter: e.target.value })}
                      style={{ background: 'transparent', border: 'none', flex: 1, outline: 'none', color: 'var(--text-h)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '6px' }}>Founder LinkedIn (optional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px' }}>
                    <Linkedin style={{ width: '18px', height: '18px', opacity: 0.5 }} />
                    <input
                      type="text"
                      placeholder="https://linkedin.com/in/janedoe"
                      value={formData.founder_linkedin}
                      onChange={(e) => setFormData({ ...formData, founder_linkedin: e.target.value })}
                      style={{ background: 'transparent', border: 'none', flex: 1, outline: 'none', color: 'var(--text-h)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Brand Assets */}
              <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--text-h)' }}>3. Brand Assets</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '6px' }}>Logo URL</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px' }}>
                    <Image style={{ width: '18px', height: '18px', opacity: 0.5 }} />
                    <input
                      type="url"
                      placeholder="https://mysaas.com/logo.png"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      style={{ background: 'transparent', border: 'none', flex: 1, outline: 'none', color: 'var(--text-h)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '6px' }}>Screenshot / Product Mockup URL</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px' }}>
                    <Image style={{ width: '18px', height: '18px', opacity: 0.5 }} />
                    <input
                      type="url"
                      placeholder="https://mysaas.com/dashboard-mock.jpg"
                      value={formData.screenshot_url}
                      onChange={(e) => setFormData({ ...formData, screenshot_url: e.target.value })}
                      style={{ background: 'transparent', border: 'none', flex: 1, outline: 'none', color: 'var(--text-h)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button
                  type="button"
                  onClick={() => setView('landing')}
                  style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text)', fontSize: '15px', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '12px 32px', background: 'linear-gradient(to right, var(--accent), #8b5cf6)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#fff', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(170, 59, 255, 0.3)' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" style={{ width: '18px', height: '18px' }} /> Creating Profile...
                    </>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 3: CHECKOUT / PAYMENT */}
        {view === 'checkout' && currentStartup && (
          <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', textAlign: 'left', boxShadow: 'var(--shadow)' }}>
            <h2 style={{ fontSize: '28px', color: 'var(--text-h)', marginBottom: '8px', textAlign: 'center' }}>Pay with PayPal</h2>
            <p style={{ color: 'var(--text)', marginBottom: '32px', textAlign: 'center' }}>Complete your order by sending payment via PayPal.Me.</p>

            {/* Invoice summary card */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Order Invoice Summary</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                <span style={{ color: 'var(--text)' }}>Product Service:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-h)', textTransform: 'capitalize' }}>DirectoryJet {currentStartup.plan} Tier</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                <span style={{ color: 'var(--text)' }}>Startup Listing Name:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-h)' }}>{currentStartup.name}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                <span style={{ color: 'var(--text)' }}>Target Submissions:</span>
                <span style={{ fontWeight: '600', color: 'var(--accent)' }}>
                  {currentStartup.plan === 'essential' ? '20 Core Directories' : '50+ Premium Platforms'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '16px', marginTop: '16px', fontSize: '18px', fontWeight: 'bold' }}>
                <span style={{ color: 'var(--text-h)' }}>Total Amount Due:</span>
                <span style={{ color: 'var(--accent)', fontSize: '22px' }}>
                  {currentStartup.plan === 'essential' ? '$79.00' : currentStartup.plan === 'premium' ? '$149.00' : '$399.00'}
                </span>
              </div>
            </div>

            {/* PayPal Instructions */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px', marginBottom: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-h)', fontWeight: '600', marginBottom: '16px' }}>
                Step 1: Click the button below to pay via PayPal.Me
              </div>
              
              <a 
                href={`https://paypal.me/CindyT102/${currentStartup.plan === 'essential' ? 79 : currentStartup.plan === 'premium' ? 149 : 399}`}
                target="_blank"
                rel="noreferrer"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '12px 24px', 
                  background: '#0070ba', 
                  color: '#fff', 
                  borderRadius: '99px', 
                  textDecoration: 'none', 
                  fontWeight: 'bold', 
                  fontSize: '16px',
                  marginBottom: '20px',
                  boxShadow: '0 4px 12px rgba(0, 112, 186, 0.3)'
                }}
              >
                Pay ${currentStartup.plan === 'essential' ? 79 : currentStartup.plan === 'premium' ? 149 : 399} with PayPal.Me
              </a>

              <div style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.5' }}>
                <strong>Important:</strong> Include your Startup ID in the payment note so we can verify your order manually:<br/>
                <code style={{ fontSize: '14px', background: 'var(--bg)', padding: '4px 8px', borderRadius: '4px', color: 'var(--accent)', fontWeight: 'bold', display: 'inline-block', marginTop: '8px' }}>{currentStartup.id}</code>
              </div>
            </div>

            <div style={{ fontSize: '14px', color: 'var(--text-h)', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
              Step 2: After paying, click below to start your submissions
            </div>

            {/* Confirm Payment Button */}
            <button
              onClick={handleSimulatePayment}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '16px', background: 'linear-gradient(to right, var(--accent), #8b5cf6)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(170, 59, 255, 0.3)' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: '20px', height: '20px' }} /> Verifying Payment...
                </>
              ) : (
                "I've Completed Payment — Start Submissions"
              )}
            </button>
          </div>
        )}

        {/* VIEW 4: PROGRESS TRACKING DASHBOARD */}
        {view === 'dashboard' && currentStartup && (
          <div style={{ textAlign: 'left' }}>
            
            {/* Dashboard Header metadata */}
            <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '32px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', boxShadow: 'var(--shadow)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '28px', color: 'var(--text-h)', margin: 0 }}>{currentStartup.name}</h2>
                  <span style={{ fontSize: '12px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', padding: '3px 10px', borderRadius: '99px', color: 'var(--accent)', fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {currentStartup.plan} Jet
                  </span>
                </div>
                <p style={{ color: 'var(--text)', fontSize: '15px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Link2 style={{ width: '16px', height: '16px' }} /> <a href={currentStartup.website_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>{currentStartup.website_url}</a>
                </p>
                <p style={{ color: 'var(--text)', fontSize: '15px', margin: 0 }}>
                  <strong>ID:</strong> <code style={{ fontSize: '12px', background: 'var(--bg)', padding: '2px 6px', borderRadius: '4px' }}>{currentStartup.id}</code> (Save this ID to review this dashboard later!)
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={() => fetchDashboardData(currentStartup.id, true)}
                  disabled={isRefreshing}
                  style={{ padding: '10px 16px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <RefreshCw className={isRefreshing ? "animate-spin" : ""} style={{ width: '16px', height: '16px' }} /> Refresh Status
                </button>

                <button
                  onClick={handleManualTrigger}
                  style={{ padding: '10px 16px', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                >
                  Trigger Retries
                </button>
              </div>
            </div>

            {/* Real-time progress bar and stats */}
            <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '32px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-h)', margin: 0 }}>Submission Engine Status</h3>
                <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)' }}>{stats.percent}% Ready</span>
              </div>

              {/* Graphical Progress Bar */}
              <div style={{ width: '100%', height: '10px', background: 'var(--bg)', borderRadius: '99px', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ height: '100%', width: `${stats.percent}%`, background: 'linear-gradient(to right, var(--accent), #8b5cf6)', borderRadius: '99px', transition: 'width 0.5s ease-out' }} />
              </div>

              {/* Status breakdown grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent)' }}>{stats.completed}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text)' }}>Approved / Live</div>
                </div>

                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#fbbf24' }}>{stats.submitted}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text)' }}>Pending Review</div>
                </div>

                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#3b82f6' }}>{stats.active}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text)' }}>Running</div>
                </div>

                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-h)' }}>{stats.total}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text)' }}>Total Directories</div>
                </div>
              </div>
            </div>

            {/* Submission lists grid */}
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-h)', marginBottom: '16px' }}>Directory Submissions Log</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {submissions.map((sub) => {
                let badgeStyle = { background: 'var(--border)', color: 'var(--text)' };
                let statusLabel = 'Waiting';

                if (sub.status === 'submitting') {
                  badgeStyle = { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' };
                  statusLabel = 'Autofilling...';
                } else if (sub.status === 'submitted') {
                  badgeStyle = { background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)' };
                  statusLabel = 'Moderator Review';
                } else if (sub.status === 'approved') {
                  badgeStyle = { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
                  statusLabel = 'Approved (Live)';
                } else if (sub.status === 'failed') {
                  badgeStyle = { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
                  statusLabel = 'Blocked / Failed';
                }

                return (
                  <div key={sub.id} style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', justifySelf: 'stretch', justifyContent: 'space-between', minHeight: '120px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-h)', fontSize: '16px' }}>{sub.directory_name}</span>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', ...badgeStyle }}>
                          {statusLabel}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '12px' }}>
                        Main site: <a href={sub.directory_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>{sub.directory_url}</a>
                      </div>
                    </div>

                    <div>
                      {sub.status === 'approved' && sub.link ? (
                        <a
                          href={sub.link}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#10b981', fontWeight: '600', textDecoration: 'underline' }}
                        >
                          View Live Directory Listing <ArrowRight style={{ width: '14px', height: '14px' }} />
                        </a>
                      ) : sub.status === 'failed' ? (
                        <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>Retry trigger active.</span>
                      ) : sub.status === 'submitting' ? (
                        <span style={{ fontSize: '13px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} /> Launching chrome driver...
                        </span>
                      ) : (
                        <span style={{ fontSize: '13px', color: 'var(--text)', opacity: 0.6 }}>Awaiting background slot.</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px', background: 'var(--code-bg)', color: 'var(--text)', fontSize: '14px', textAlign: 'center', marginTop: '64px' }}>
        <p>© 2026 DirectoryJet. Crafted for Indie Hackers and SaaS Bootstrappers.</p>
      </footer>
    </div>
  );
}
