import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import PasswordInput from '../components/PasswordInput';
import IndiamartGuideModal from '../components/IndiamartGuideModal';
import ServiceFormModal from '../components/ServiceFormModal';

const steps = ['IndiaMART API', 'Email Setup', 'WhatsApp', 'Add Service', 'Complete'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // IndiaMART
  const [indiamartKey, setIndiamartKey] = useState('');
  const [showImGuide, setShowImGuide] = useState(false);

  // Email SMTP
  const [smtp, setSmtp] = useState({ host: 'smtp.gmail.com', port: 587, user: '', pass: '', fromName: 'Odd Infotech' });

  // WhatsApp
  const [qr, setQr] = useState(null);
  const [waConnected, setWaConnected] = useState(false);
  const [connectingWa, setConnectingWa] = useState(false);

  // Service
  const [services, setServices] = useState([]);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Gemini AI
  const [geminiKey, setGeminiKey] = useState('');

  // Status & loading
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadStatusAndServices() {
    try {
      const { data: statusData } = await api.get('/settings/status');
      setStatus(statusData);
      const { data: servicesData } = await api.get('/services');
      setServices(servicesData);
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  }

  useEffect(() => {
    loadStatusAndServices();
    if (step === 2) {
      api.get('/whatsapp/qr').then(({ data }) => {
        if (data.qr) setQr(data.qr);
      }).catch(() => {});
    }
  }, [step]);

  function next() {
    setError('');
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function prev() {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  }

  async function saveIndiamart() {
    if (!indiamartKey.trim()) {
      setError('Please provide your IndiaMART CRM API key to proceed.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.put('/settings/indiamart', { apiKey: indiamartKey, autoSyncEnabled: true });
      next();
    } catch (err) {
      const msg = err.response?.data?.message || (err.message === 'Network Error' ? 'Cannot connect to backend server. Please make sure backend is running.' : err.message) || 'Could not save IndiaMART key.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function saveSmtp() {
    if (!smtp.host || !smtp.user || !smtp.pass) {
      setError('Please fill in SMTP Host, Email Address, and Password/App Password.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.put('/settings/smtp', smtp);
      next();
    } catch (err) {
      const msg = err.response?.data?.message || (err.message === 'Network Error' ? 'Cannot connect to backend server. Please make sure backend is running.' : err.message) || 'Could not save SMTP settings.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function connectWhatsapp() {
    setConnectingWa(true);
    setError('');
    try {
      await api.post('/whatsapp/connect');
      const interval = setInterval(async () => {
        const { data: qrData } = await api.get('/whatsapp/qr');
        const { data: statusData } = await api.get('/whatsapp/status');
        if (statusData.sessionActive) {
          setWaConnected(true);
          setConnectingWa(false);
          clearInterval(interval);
        } else if (qrData.qr) {
          setQr(qrData.qr);
          setConnectingWa(false);
        }
      }, 1500);
      setTimeout(() => {
        clearInterval(interval);
        setConnectingWa(false);
      }, 120000);
    } catch (err) {
      setConnectingWa(false);
      setError(err.response?.data?.message || 'Could not connect WhatsApp.');
    }
  }

  async function saveGemini() {
    setSaving(true);
    try {
      if (geminiKey) await api.put('/settings/gemini', { apiKey: geminiKey });
      next();
    } finally {
      setSaving(false);
    }
  }

  async function handleFinish() {
    try {
      const { data: statusData } = await api.get('/settings/status');
      const details = statusData.details || {};
      const imOk = details.indiamart || details.indiamartConfigured;
      const smtpOk = details.smtp || details.smtpConfigured;
      const srvOk = details.services || details.serviceConfigured;

      if (!imOk || !smtpOk || !srvOk) {
        setError('Please complete all required setup steps (IndiaMART key, Email, and at least 1 Service).');
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      navigate('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-10">
      <IndiamartGuideModal isOpen={showImGuide} onClose={() => setShowImGuide(false)} />
      <ServiceFormModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onSaved={loadStatusAndServices}
      />

      <div className="w-full max-w-2xl">
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                if (i <= step) {
                  setError('');
                  setStep(i);
                }
              }}
              className={`flex-1 text-left ${i <= step ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-signal' : 'bg-line'}`} />
              <div className={`text-[10px] mt-1 font-medium truncate ${i === step ? 'text-signal font-semibold' : i < step ? 'text-ink hover:underline' : 'text-slate'}`}>
                {s}
              </div>
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-line shadow-card p-8">
          {error && (
            <div className="text-sm text-ember bg-ember/10 border border-ember/20 rounded-lg px-4 py-2.5 mb-6">
              {error}
            </div>
          )}

          {/* STEP 0: IndiaMART */}
          {step === 0 && (
            <StepShell
              title="Connect IndiaMART CRM API"
              desc="Paste your IndiaMART Lead Manager CRM API key to auto-sync leads into LeadHub."
            >
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate">IndiaMART CRM API Key *</label>
                    <button
                      type="button"
                      onClick={() => setShowImGuide(true)}
                      className="text-xs text-signal font-semibold hover:underline flex items-center gap-1"
                    >
                      📖 How to get API Key?
                    </button>
                  </div>
                  <input
                    value={indiamartKey}
                    onChange={(e) => setIndiamartKey(e.target.value)}
                    placeholder="Paste your IndiaMART CRM API key (e.g. mGlusr_CRM_Key...)"
                    className="w-full border border-line rounded-lg px-3 py-2.5 text-sm font-mono focus:border-signal outline-none"
                  />
                </div>

                <div className="bg-paper p-4 rounded-xl border border-line flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-ink">Don't know how to find your API key?</div>
                    <div className="text-xs text-slate">View our step-by-step visual guide to get your key in 2 minutes.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImGuide(true)}
                    className="bg-signal/10 text-signal hover:bg-signal/20 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shrink-0"
                  >
                    Open Guide
                  </button>
                </div>
              </div>
              <Actions onNext={saveIndiamart} saving={saving} />
            </StepShell>
          )}

          {/* STEP 1: Email SMTP */}
          {step === 1 && (
            <StepShell title="Connect Outgoing Email (SMTP)" desc="Required to send auto-proposals and brochures to leads.">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate mb-1 block">SMTP Host *</label>
                    <input
                      value={smtp.host}
                      onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full border border-line rounded-lg px-3 py-2.5 text-sm font-mono focus:border-signal outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate mb-1 block">Port *</label>
                    <input
                      type="number"
                      value={smtp.port}
                      onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })}
                      placeholder="587"
                      className="w-full border border-line rounded-lg px-3 py-2.5 text-sm font-mono focus:border-signal outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate mb-1 block">Email Address *</label>
                  <input
                    type="email"
                    value={smtp.user}
                    onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                    placeholder="you@company.com"
                    className="w-full border border-line rounded-lg px-3 py-2.5 text-sm font-mono focus:border-signal outline-none"
                  />
                </div>
                <PasswordInput
                  label="Password / App Password *"
                  value={smtp.pass}
                  onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                  placeholder="App Password for Gmail / Zoho"
                  hint="For Gmail, use a 16-character App Password from myaccount.google.com/apppasswords"
                />
                <div>
                  <label className="text-xs font-medium text-slate mb-1 block">Sender Name</label>
                  <input
                    value={smtp.fromName}
                    onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })}
                    placeholder="Odd Infotech"
                    className="w-full border border-line rounded-lg px-3 py-2.5 text-sm font-mono focus:border-signal outline-none"
                  />
                </div>
              </div>
              <Actions onNext={saveSmtp} onPrev={prev} saving={saving} />
            </StepShell>
          )}

          {/* STEP 2: WhatsApp */}
          {step === 2 && (
            <StepShell
              title="Connect WhatsApp Web"
              desc="Scan with the WhatsApp number you want greetings & attachments to be sent from."
            >
              <div className="flex flex-col items-center gap-4 py-4">
                {waConnected || status?.details?.whatsappConfigured ? (
                  <div className="text-growth font-medium text-sm bg-growth/10 border border-growth/20 px-4 py-2 rounded-lg flex items-center gap-2">
                    <span>✓</span> WhatsApp is connected & ready!
                  </div>
                ) : qr ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-white border border-line rounded-2xl shadow-card">
                      <img src={qr} alt="WhatsApp QR Code" className="w-52 h-52 object-contain" />
                    </div>
                    <div className="text-xs text-ink font-medium bg-paper px-3 py-1.5 rounded-full border border-line">
                      📲 Open WhatsApp &gt; Menu / Settings &gt; Linked Devices &gt; Scan QR Code
                    </div>
                  </div>
                ) : connectingWa ? (
                  <div className="flex flex-col items-center justify-center p-6 border border-dashed border-signal/40 rounded-xl bg-signal/5 text-center space-y-3">
                    <div className="w-8 h-8 border-3 border-signal border-t-transparent rounded-full animate-spin" />
                    <div>
                      <div className="text-sm font-semibold text-ink">Starting WhatsApp Web...</div>
                      <div className="text-xs text-slate mt-1">Generating QR code (5–10 seconds). Please wait...</div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={connectWhatsapp}
                    className="bg-signal hover:bg-signalDark text-white text-sm font-medium rounded-lg px-6 py-2.5 transition-colors shadow-sm"
                  >
                    Show QR Code
                  </button>
                )}
              </div>
              <Actions onNext={next} onPrev={prev} onSkip={next} saving={false} />
            </StepShell>
          )}

          {/* STEP 3: Add Services */}
          {step === 3 && (
            <StepShell
              title="Add Products / Services & Templates"
              desc="Create your services (e.g. Web Design, Solar Panels). Set up Email & WhatsApp templates with file attachments!"
            >
              <div className="space-y-4">
                {services.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-line rounded-xl p-6 bg-paper/50">
                    <div className="text-3xl mb-2">📦</div>
                    <div className="text-sm font-semibold text-ink mb-1">No services added yet</div>
                    <div className="text-xs text-slate mb-4 max-w-md mx-auto">
                      Add at least 1 service with custom email & WhatsApp templates + brochure attachments. Leads for this service will automatically receive your proposal.
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowServiceModal(true)}
                      className="bg-signal hover:bg-signalDark text-white text-sm font-medium rounded-lg px-5 py-2.5 transition-colors"
                    >
                      + Add 1st Service
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-semibold text-slate uppercase tracking-wider">
                        Configured Services ({services.length})
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowServiceModal(true)}
                        className="text-xs text-signal font-semibold hover:underline"
                      >
                        + Add Another Service
                      </button>
                    </div>

                    <div className="space-y-2">
                      {services.map((srv) => (
                        <div key={srv._id} className="p-4 rounded-xl border border-line bg-paper/60 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-sm text-ink">{srv.name}</div>
                            <div className="text-xs text-slate mt-0.5">
                              Keywords: {srv.keywords?.join(', ') || 'Default'}
                            </div>
                            <div className="flex gap-3 text-[11px] text-slate/80 mt-1">
                              <span>📧 Email Attach: {srv.emailAttachment?.filename ? '✓ Yes' : 'None'}</span>
                              <span>💬 WA Attach: {srv.whatsappAttachment?.filename ? '✓ Yes' : 'None'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Actions onNext={next} onPrev={prev} saving={false} disabled={services.length === 0} />
            </StepShell>
          )}

          {/* STEP 4: Complete */}
          {step === 4 && (
            <StepShell title="Setup Complete!" desc="Review your configuration below. Once confirmed, enter your dashboard.">
              <div className="space-y-3 py-2">
                <div className="p-4 rounded-xl border border-line bg-paper/60 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate">IndiaMART API Key:</span>
                    <span className="font-semibold text-growth">Configured ✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate">Email SMTP:</span>
                    <span className="font-semibold text-growth">Configured ✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate">Services Added:</span>
                    <span className="font-semibold text-growth">{services.length} Service(s) Ready ✓</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-line mt-4">
                <button
                  type="button"
                  onClick={prev}
                  className="border border-line bg-paper hover:bg-line/40 text-ink text-sm font-medium rounded-lg px-5 py-3 transition-colors flex items-center gap-1.5"
                >
                  <span>←</span> Back
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-1 bg-signal hover:bg-signalDark transition-colors text-white text-sm font-semibold rounded-lg py-3"
                >
                  Go to Dashboard 🚀
                </button>
              </div>
            </StepShell>
          )}
        </div>
      </div>
    </div>
  );
}

function StepShell({ title, desc, children }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-semibold text-lg text-ink">{title}</h1>
        <p className="text-sm text-slate mt-1">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Actions({ onNext, onPrev, onSkip, saving, disabled }) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-line mt-6">
      <div className="flex items-center gap-3">
        {onPrev && (
          <button
            type="button"
            onClick={onPrev}
            disabled={saving}
            className="border border-line bg-paper hover:bg-line/40 text-ink text-sm font-medium rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>←</span> Back
          </button>
        )}
        {onSkip && (
          <button type="button" onClick={onSkip} className="text-sm text-slate hover:text-ink">
            Skip for now
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={saving || disabled}
        className="bg-signal hover:bg-signalDark transition-colors text-white text-sm font-medium rounded-lg px-6 py-2.5 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}
