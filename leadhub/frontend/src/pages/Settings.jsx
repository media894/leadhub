import { useEffect, useState } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';
import PasswordInput from '../components/PasswordInput';
import IndiamartGuideModal from '../components/IndiamartGuideModal';
import ServiceFormModal from '../components/ServiceFormModal';

export default function Settings() {
  const [tab, setTab] = useState('IndiaMART');
  const [settings, setSettings] = useState(null);
  const [toast, setToast] = useState('');

  const userStr = localStorage.getItem('leadhub_user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isMasterAdmin =
    currentUser?.email?.toLowerCase() === 'natasha@oddinfotech.com';

  const availableTabs = isMasterAdmin
    ? ['IndiaMART', 'Services', 'Email', 'Users & Access']
    : ['IndiaMART', 'Services', 'Email'];

  async function load() {
    try {
      const { data } = await api.get('/settings');
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  if (!settings) {
    return (
      <div className="flex min-h-screen bg-[#121316] text-slate-200">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-slate-300 text-xs font-extrabold">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#121316] text-slate-200 font-sans selection:bg-amber-500/30">
      <Sidebar />
      <main className="flex-1 max-w-5xl mx-auto px-8 py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white mb-1">Settings & Configurations</h1>
          <p className="text-xs text-slate-200 font-semibold">
            Configure IndiaMART API key, products & proposal templates, Email SMTP credentials, and User Approvals.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-[#26272c] overflow-x-auto pb-1">
          {availableTabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap border ${
                tab === t
                  ? 'bg-[#29221d] text-amber-400 border-amber-600/50 shadow-md'
                  : 'bg-[#18191d] text-slate-100 border-[#26272c] hover:bg-[#202126] hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'IndiaMART' && <IndiamartTab settings={settings} reload={load} toast={showToast} />}
        {tab === 'Services' && <ServicesTab toast={showToast} />}
        {tab === 'Email' && <EmailTab settings={settings} reload={load} toast={showToast} />}
        {tab === 'Users & Access' && isMasterAdmin && <UsersTab toast={showToast} />}

        {toast && (
          <div className="fixed bottom-6 right-6 bg-amber-500 text-neutral-950 font-black text-xs px-5 py-3 rounded-xl shadow-2xl z-50 animate-slideIn">
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-extrabold text-amber-400 uppercase tracking-wider block">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-200 font-semibold mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-amber-500' : 'bg-[#333540]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

const inputClass =
  'w-full bg-[#121316] border border-[#383a45] rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-amber-500 outline-none shadow-inner';

function SaveButton({ onClick, saving, children = 'Save Settings' }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="bg-amber-500 hover:bg-amber-600 transition-colors text-neutral-950 text-xs font-extrabold rounded-xl px-6 py-2.5 disabled:opacity-50 shadow-md"
    >
      {saving ? 'Saving...' : children}
    </button>
  );
}

function Card({ children }) {
  return <div className="bg-[#18191d] rounded-2xl border border-[#2d2e36] shadow-xl p-6 space-y-5">{children}</div>;
}

function IndiamartTab({ settings, reload, toast }) {
  const [apiKey, setApiKey] = useState(settings.indiamart?.apiKey || '');
  const [autoSync, setAutoSync] = useState(settings.indiamart?.autoSyncEnabled ?? true);
  const [interval, setInterval_] = useState(settings.indiamart?.syncIntervalMinutes ?? 1);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (settings.indiamart?.apiKey) {
      setApiKey(settings.indiamart.apiKey);
    }
  }, [settings]);

  async function save() {
    if (!apiKey) {
      toast('Please enter your IndiaMART CRM key.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/settings/indiamart', { apiKey, autoSyncEnabled: autoSync, syncIntervalMinutes: interval });
      toast('IndiaMART key saved! Syncing leads now...');
      await reload();
      try {
        const { data } = await api.post('/leads/sync');
        toast(`Sync complete! ${data.created || 0} new lead(s) fetched.`);
      } catch (e) {
        console.log('Post-save sync alert:', e.message);
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save IndiaMART key.');
    } finally {
      setSaving(false);
    }
  }

  async function syncNow() {
    setSyncing(true);
    try {
      const { data } = await api.post('/leads/sync');
      toast(`Synced. ${data.created} new lead(s) found.`);
    } catch (err) {
      toast(err.response?.data?.message || 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  }

  async function disconnectIndiamart() {
    if (!window.confirm('Are you sure you want to disconnect IndiaMART?')) return;
    try {
      await api.post('/settings/indiamart/disconnect');
      toast('IndiaMART disconnected.');
      setApiKey('');
      reload();
    } catch (err) {
      toast('Disconnect failed.');
    }
  }

  const maskedKeyText = settings.indiamart?.apiKey
    ? '••••••••••••••••••••••••'
    : '';

  return (
    <Card>
      <IndiamartGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      <div className="flex items-center justify-between border-b border-[#2d2e36] pb-4">
        <div>
          <h2 className="font-display font-extrabold text-lg text-white">IndiaMART Lead Manager API</h2>
          <p className="text-xs text-slate-200 font-semibold mt-0.5">
            Connect your IndiaMART Seller Panel CRM key to automatically pull incoming buyer leads.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-full border shadow-sm ${
              settings.indiamart.connected
                ? 'bg-[#173d2a] text-emerald-400 border-emerald-600'
                : 'bg-[#381c1c] text-red-400 border-red-800'
            }`}
          >
            {settings.indiamart.connected ? 'Connected ✓' : 'Not Connected ✕'}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center bg-[#241f17] p-4 rounded-xl border border-amber-600/40">
        <span className="text-xs text-slate-100 font-bold">
          Need help getting your API Key from IndiaMART Seller Panel?
        </span>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="text-xs text-amber-400 font-extrabold hover:text-amber-300 flex items-center gap-1.5"
        >
          📖 View API Key Guide
        </button>
      </div>

      <Field
        label="API KEY"
        hint={settings.indiamart?.apiKeySet ? (settings.indiamart?.connected ? 'CRM Key Status: Active & Secured ✓' : 'CRM Key Status: Saved') : 'Paste your IndiaMART CRM API key'}
      >
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your IndiaMART CRM API key (e.g. mky/12345...)"
            className={`${inputClass} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            {showKey ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 014.122-.863c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21m-4.22-4.22L3 3" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </Field>

      <div className="flex items-center justify-between border-t border-[#2d2e36] pt-4">
        <div>
          <div className="text-xs font-extrabold text-white">Auto-sync new leads</div>
          <div className="text-xs text-slate-200 font-semibold">Automatically pull new leads on a recurring schedule</div>
        </div>
        <Toggle checked={autoSync} onChange={setAutoSync} />
      </div>

      {autoSync && (
        <Field label="SYNC INTERVAL (MINUTES)">
          <input
            type="number"
            min="1"
            value={interval}
            onChange={(e) => setInterval_(Number(e.target.value))}
            className={`${inputClass} w-36`}
          />
        </Field>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-[#2d2e36]">
        <div className="flex gap-3">
          <SaveButton onClick={save} saving={saving} />
          <button
            onClick={syncNow}
            disabled={syncing}
            className="bg-[#282a33] hover:bg-[#323540] text-slate-100 text-xs font-extrabold border border-[#383a45] rounded-xl px-5 py-2.5 disabled:opacity-50 transition-all shadow-sm"
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {settings.indiamart.connected && (
          <button
            onClick={disconnectIndiamart}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>🔌</span> Disconnect IndiaMART
          </button>
        )}
      </div>
    </Card>
  );
}

function ServicesTab({ toast }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  async function fetchServices() {
    setLoading(true);
    try {
      const { data } = await api.get('/services');
      setServices(data);
    } catch (err) {
      toast('Could not load services.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  function handleOpenAdd() {
    setSelectedService(null);
    setModalOpen(true);
  }

  function handleOpenEdit(srv) {
    setSelectedService(srv);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this service & all its templates?')) return;
    try {
      await api.delete(`/services/${id}`);
      toast('Service deleted.');
      fetchServices();
    } catch (err) {
      toast('Could not delete service.');
    }
  }

  return (
    <Card>
      <ServiceFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        serviceToEdit={selectedService}
        onSaved={fetchServices}
      />

      <div className="flex items-center justify-between border-b border-[#2d2e36] pb-4">
        <div>
          <h2 className="font-display font-extrabold text-lg text-white">Products & Services Templates</h2>
          <p className="text-xs text-slate-200 font-semibold mt-0.5">
            Add individual services with custom proposal email & WhatsApp templates + attachments (PDFs, brochures, GIFs).
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md"
        >
          + Add New Service
        </button>
      </div>

      {loading ? (
        <div className="text-xs text-slate-300 py-6 text-center">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-10 bg-[#141518] rounded-2xl border border-dashed border-[#2c2d35] space-y-3">
          <div className="text-3xl">📦</div>
          <div className="text-sm font-bold text-white">No custom services created yet</div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create custom service templates for Web Dev, Solar, Graphic Design, etc., to send matching PDF brochures & messages automatically!
          </p>
          <button
            onClick={handleOpenAdd}
            className="bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-extrabold px-4 py-2 rounded-xl transition-colors shadow"
          >
            Create First Service
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((srv) => (
            <div
              key={srv._id}
              className="bg-[#141518] p-5 rounded-2xl border border-[#282930] space-y-3 hover:border-amber-500/40 transition-colors shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-100 text-base">{srv.name}</h3>
                    {srv.isDefault && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded border border-amber-500/40">
                        Default Fallback
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    <span className="text-amber-400 font-bold">Matching Keywords:</span>{' '}
                    {Array.isArray(srv.keywords) ? srv.keywords.join(', ') : srv.keywords || 'None'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(srv)}
                    className="text-xs text-amber-400 font-bold bg-[#282a33] hover:bg-amber-500 hover:text-neutral-950 border border-amber-500/30 px-3.5 py-1.5 rounded-xl transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(srv._id)}
                    className="text-xs text-red-400 font-bold bg-[#3b1e1e] hover:bg-red-600 hover:text-white border border-red-800 px-3.5 py-1.5 rounded-xl transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-slate-200 pt-2 border-t border-[#26272c]">
                <div className="bg-[#1a1b20] p-3 rounded-xl border border-[#2c2d34] space-y-1">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>📧 Email Proposal</span>
                    {srv.emailAttachment?.filename && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-800">
                        📎 {srv.emailAttachment.filename}
                      </span>
                    )}
                  </div>
                  <div className="truncate font-mono text-[11px] text-slate-300">{srv.emailSubject}</div>
                </div>

                <div className="bg-[#1a1b20] p-3 rounded-xl border border-[#2c2d34] space-y-1">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>💬 WhatsApp Greeting</span>
                    {srv.whatsappAttachment?.filename && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-800">
                        📎 {srv.whatsappAttachment.filename}
                      </span>
                    )}
                  </div>
                  <div className="truncate font-mono text-[11px] text-slate-300">{srv.whatsappMessage}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function EmailTab({ settings, reload, toast }) {
  const [form, setForm] = useState({
    host: settings.smtp.host || 'smtp.gmail.com',
    port: settings.smtp.port || 587,
    secure: settings.smtp.secure || false,
    user: settings.smtp.user || '',
    pass: settings.smtp.pass || '',
    fromName: settings.smtp.fromName || '',
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.put('/settings/smtp', form);
      toast('Email settings saved.');
      reload();
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    try {
      const { data } = await api.post('/settings/smtp/test');
      toast(data.message);
    } catch (err) {
      toast(err.response?.data?.message || 'Test failed.');
    } finally {
      setTesting(false);
    }
  }

  async function disconnectEmail() {
    if (!window.confirm('Are you sure you want to disconnect Email SMTP?')) return;
    try {
      await api.post('/settings/smtp/disconnect');
      toast('Email SMTP disconnected.');
      setForm({ host: '', port: 587, secure: false, user: '', pass: '', fromName: 'Odd Infotech' });
      reload();
    } catch (err) {
      toast('Disconnect failed.');
    }
  }

  const isEmailConnected = settings.smtp.connected || (settings.smtp.passSet && settings.smtp.user);

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-[#2d2e36] pb-4">
        <div>
          <h2 className="font-display font-extrabold text-lg text-white">SMTP (Outgoing Email Server)</h2>
          <p className="text-xs text-slate-200 font-semibold mt-0.5">
            Use your business email's SMTP details (e.g. Gmail App Password, Zoho Mail, or custom mail server).
          </p>
        </div>

        <span
          className={`text-xs font-extrabold px-3 py-1 rounded-full border shadow-sm ${
            isEmailConnected
              ? 'bg-[#173d2a] text-emerald-400 border-emerald-600'
              : 'bg-[#381c1c] text-red-400 border-red-800'
          }`}
        >
          {isEmailConnected ? 'Connected ✓' : 'Not Verified ✕'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="SMTP HOST">
          <input
            value={form.host}
            onChange={(e) => setForm({ ...form, host: e.target.value })}
            placeholder="smtp.gmail.com"
            className={inputClass}
          />
        </Field>
        <Field label="SMTP PORT">
          <input
            type="number"
            value={form.port}
            onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
            placeholder="587"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="SENDER EMAIL ADDRESS">
        <input
          value={form.user}
          onChange={(e) => setForm({ ...form, user: e.target.value })}
          placeholder="you@company.com"
          className={inputClass}
        />
      </Field>

      <PasswordInput
        label="SENDER EMAIL PASSWORD / APP PASSWORD"
        value={form.pass}
        onChange={(e) => setForm({ ...form, pass: e.target.value })}
        placeholder="••••••••"
        hint={settings.smtp.passSet ? 'A password is currently saved.' : ''}
      />

      <Field label="FROM NAME (DISPLAY NAME SHOWN TO BUYERS)">
        <input
          value={form.fromName}
          onChange={(e) => setForm({ ...form, fromName: e.target.value })}
          placeholder="Company Admin"
          className={inputClass}
        />
      </Field>

      <div className="flex items-center gap-2.5 pt-1">
        <input
          type="checkbox"
          id="secure"
          checked={form.secure}
          onChange={(e) => setForm({ ...form, secure: e.target.checked })}
          className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
        />
        <label htmlFor="secure" className="text-xs font-bold text-white cursor-pointer">
          Use SSL Security (usually port 465)
        </label>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#2d2e36]">
        <div className="flex gap-3">
          <SaveButton onClick={save} saving={saving} />
          <button
            onClick={test}
            disabled={testing}
            className="bg-[#282a33] hover:bg-[#323540] text-slate-100 text-xs font-extrabold border border-[#383a45] rounded-xl px-5 py-2.5 disabled:opacity-50 transition-all shadow-sm"
          >
            {testing ? 'Testing Connection...' : 'Test Connection'}
          </button>
        </div>

        {isEmailConnected && (
          <button
            onClick={disconnectEmail}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>🔌</span> Disconnect Email
          </button>
        )}
      </div>
    </Card>
  );
}

function UsersTab({ toast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data);
    } catch (err) {
      toast('Could not fetch user list.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function toggleApproval(userId, currentStatus) {
    try {
      const { data } = await api.put(`/auth/users/${userId}/approve`, { isApproved: !currentStatus });
      toast(data.message);
      fetchUsers();
    } catch (err) {
      toast('Failed to update user approval.');
    }
  }

  async function deleteUser(userId, email) {
    if (!window.confirm(`Are you sure you want to delete user "${email}"? This will permanently remove their account.`)) return;
    try {
      const { data } = await api.delete(`/auth/users/${userId}`);
      toast(data.message || 'User deleted successfully.');
      fetchUsers();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete user.');
    }
  }

  async function rejectUser(userId, email) {
    if (!window.confirm(`Are you sure you want to REJECT registration for "${email}"? The user will be notified on login.`)) return;
    try {
      let data;
      try {
        const res = await api.put(`/auth/users/${userId}/reject`);
        data = res.data;
      } catch (e) {
        const res = await api.put(`/auth/users/${userId}/approve`, { isApproved: false, isRejected: true });
        data = res.data;
      }
      toast(data?.message || 'User registration rejected.');
      fetchUsers();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to reject user registration.');
    }
  }

  const otherUsers = users.filter((u) => u.email?.toLowerCase() !== 'natasha@oddinfotech.com');

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-[#2d2e36] pb-4">
        <div>
          <h2 className="font-display font-extrabold text-lg text-white">User Access & Approvals</h2>
          <p className="text-xs text-slate-200 font-semibold mt-0.5">
            Approve, reject, revoke login access, or delete registered user accounts.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="text-xs font-bold bg-[#282a33] hover:bg-[#323540] text-slate-100 px-3.5 py-2 rounded-xl border border-[#383a45] transition-all shadow-sm"
        >
          🔄 Refresh Users
        </button>
      </div>

      {loading ? (
        <div className="text-xs text-slate-300 py-6 text-center font-bold">Loading users...</div>
      ) : otherUsers.length === 0 ? (
        <div className="text-center py-10 bg-[#141518] rounded-2xl border border-dashed border-[#282930] space-y-2">
          <div className="text-3xl">👥</div>
          <div className="text-sm font-bold text-white">No other users registered yet</div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            When new team members or clients sign up or register, they will appear here for your approval.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {otherUsers.map((u) => (
            <div
              key={u._id}
              className="flex items-center justify-between p-4 bg-[#141518] rounded-xl border border-[#282930] hover:border-amber-500/30 transition-colors shadow-md"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-100">{u.name}</span>
                  {u.role === 'admin' && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-black border border-amber-500/40">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-slate-300">✉️ {u.email}</div>
                {u.companyName && <div className="text-[11px] text-amber-400 font-semibold">🏢 {u.companyName}</div>}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full border shadow-sm ${
                    u.isApproved
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                      : u.isRejected
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {u.isApproved ? 'Approved ✓' : u.isRejected ? 'Rejected ❌' : 'Pending Approval ⏳'}
                </span>

                {/* Grant / Revoke Access (Icon Only) */}
                <button
                  onClick={() => toggleApproval(u._id, u.isApproved)}
                  title={u.isApproved ? 'Revoke Access' : 'Grant Access'}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all shadow-sm border ${
                    u.isApproved
                      ? 'bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border-rose-500/30'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {u.isApproved ? '🚫' : '✅'}
                </button>

                {/* Reject User (Icon Only) */}
                {!u.isRejected && (
                  <button
                    onClick={() => rejectUser(u._id, u.email)}
                    title="Reject User Registration"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all shadow-sm bg-rose-600/25 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40"
                  >
                    ❌
                  </button>
                )}

                {/* Delete User (Icon Only) */}
                <button
                  onClick={() => deleteUser(u._id, u.email)}
                  title="Delete User Account"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all shadow-sm bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500/40"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
