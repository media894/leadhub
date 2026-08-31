import { useState, useEffect, useRef } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';

export default function WhatsappLink() {
  const [sessionActive, setSessionActive] = useState(false);
  const [connectedNumber, setConnectedNumber] = useState('');
  const [qr, setQr] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [waMessage, setWaMessage] = useState(
    `Hi {{name}} 👋, this is Natasha from Odd Infotech. Thanks for your enquiry about {{product}} on IndiaMART! Could you share a bit more about your requirement so we can send the right quote?`
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    loadSettingsAndStatus();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  async function loadSettingsAndStatus() {
    try {
      const { data: set } = await api.get('/settings');
      if (set?.whatsapp) {
        setSessionActive(set.whatsapp.sessionActive ?? false);
        setConnectedNumber(set.whatsapp.connectedNumber ?? '');
      }
      if (set?.templates?.whatsappGreeting) {
        setWaMessage(set.templates.whatsappGreeting);
      }

      const { data: status } = await api.get('/whatsapp/status');
      if (status.sessionActive) {
        setSessionActive(true);
        setConnectedNumber(status.connectedNumber || '');
      } else {
        startQrSession();
      }
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  }

  async function startQrSession() {
    setConnecting(true);
    try {
      await api.post('/whatsapp/connect');
      pollQr();
    } catch (err) {
      console.error(err);
      setConnecting(false);
    }
  }

  function pollQr() {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const { data: statusData } = await api.get('/whatsapp/status');
        if (statusData.sessionActive) {
          setSessionActive(true);
          setConnectedNumber(statusData.connectedNumber || '');
          setQr(null);
          setConnecting(false);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          showToast('WhatsApp connected successfully!');
          return;
        }

        const { data: qrData } = await api.get('/whatsapp/qr');
        if (qrData.qr) {
          setQr(qrData.qr);
          setConnecting(false);
        }
      } catch (err) {
        console.error(err);
      }
    }, 1500);

    setTimeout(() => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setConnecting(false);
    }, 120000);
  }

  async function disconnectWa() {
    try {
      await api.post('/whatsapp/disconnect');
      setSessionActive(false);
      setConnectedNumber('');
      setQr(null);
      showToast('WhatsApp session disconnected.');
    } catch (err) {
      console.error(err);
    }
  }

  async function saveTemplate() {
    setSaving(true);
    try {
      await api.put('/settings/templates', { whatsappGreeting: waMessage });
      showToast('WhatsApp Message Template saved!');
    } catch (err) {
      showToast('Failed to save template.');
    } finally {
      setSaving(false);
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  return (
    <div className="flex min-h-screen bg-[#121316] text-white font-sans selection:bg-amber-500/30">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="px-8 py-5 bg-[#16171a] border-b border-[#26272c] flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-xl">💬</span>
            <h1 className="font-display font-extrabold text-lg text-white">WhatsApp Integration</h1>
          </div>

          {toast && (
            <div className="bg-amber-500 text-neutral-950 text-xs font-bold px-4 py-2 rounded-xl shadow-lg animate-fadeIn">
              {toast}
            </div>
          )}
        </header>

        {/* Content Body */}
        <div className="px-8 py-8 max-w-4xl w-full mx-auto space-y-6">
          {/* Card 1: Connection Status & Live QR Scanner */}
          <div className="bg-[#18191d] border border-[#2d2e36] rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#2d2e36] pb-4">
              <div>
                <h2 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                  WHATSAPP CONNECTION STATUS
                </h2>
                <p className="text-xs text-slate-200 font-semibold mt-1">
                  Scan the QR code with your phone's WhatsApp to send auto-proposals from your phone number.
                </p>
              </div>

              <div>
                {sessionActive ? (
                  <span className="bg-[#173d2a] text-emerald-400 text-xs font-extrabold px-4 py-1.5 rounded-full border border-emerald-600 shadow-sm flex items-center gap-1.5">
                    <span>CONNECTED</span> <span>✓</span>
                  </span>
                ) : (
                  <span className="bg-[#381c1c] text-red-400 text-xs font-extrabold px-4 py-1.5 rounded-full border border-red-800 shadow-sm">
                    NOT CONNECTED ✕
                  </span>
                )}
              </div>
            </div>

            {/* If Connected */}
            {sessionActive ? (
              <div className="bg-[#131417] p-5 rounded-2xl border border-emerald-800 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs text-slate-200 font-bold">Linked WhatsApp Mobile Number:</div>
                  <div className="text-lg font-mono font-extrabold text-emerald-400">
                    +{connectedNumber || '919876543210'}
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    All incoming IndiaMART lead greetings & brochures will be sent directly from this WhatsApp account.
                  </div>
                </div>
                <button
                  onClick={disconnectWa}
                  className="bg-[#381c1c] hover:bg-[#4d2323] text-red-400 border border-red-800 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Disconnect WhatsApp
                </button>
              </div>
            ) : (
              /* If Not Connected -> Live QR Scanner Box */
              <div className="grid grid-cols-2 gap-6 items-center bg-[#131417] p-6 rounded-2xl border border-[#2d2e36]">
                {/* Left Step Instructions */}
                <div className="space-y-4">
                  <div className="font-extrabold text-white text-base flex items-center gap-2">
                    <span>📲</span> Scan QR Code to Link WhatsApp
                  </div>
                  <ol className="space-y-2.5 text-xs text-slate-100 font-bold">
                    <li className="flex items-start gap-2.5">
                      <span className="bg-amber-500 text-neutral-950 font-black px-2 py-0.5 rounded text-xs shrink-0">1</span>
                      <span className="text-slate-100">Open <strong className="text-white">WhatsApp</strong> on your mobile phone.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="bg-amber-500 text-neutral-950 font-black px-2 py-0.5 rounded text-xs shrink-0">2</span>
                      <span className="text-slate-100">Tap <strong className="text-white">Menu (⋮)</strong> or <strong className="text-white">Settings ➔ Linked Devices</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="bg-amber-500 text-neutral-950 font-black px-2 py-0.5 rounded text-xs shrink-0">3</span>
                      <span className="text-slate-100">Tap <strong className="text-white">Link a Device</strong> and point camera at the QR code.</span>
                    </li>
                  </ol>
                  <div className="pt-2">
                    <button
                      onClick={startQrSession}
                      disabled={connecting}
                      className="bg-amber-500 hover:bg-amber-600 text-neutral-950 border border-amber-600 text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50"
                    >
                      {connecting ? 'Generating QR Code...' : '🔄 Refresh QR Code'}
                    </button>
                  </div>
                </div>

                {/* Right QR Image Box */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-4 border-amber-500 shadow-2xl">
                  {qr ? (
                    <img src={qr} alt="WhatsApp QR Code" className="w-56 h-56 object-contain" />
                  ) : (
                    <div className="w-56 h-56 flex flex-col items-center justify-center text-center p-4 text-neutral-900 space-y-2">
                      <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      <div className="text-xs font-black text-neutral-900">Loading Live WhatsApp QR...</div>
                      <div className="text-[11px] text-neutral-700 font-bold">Generating secure device session</div>
                    </div>
                  )}
                  <span className="text-xs text-neutral-950 font-black mt-2">
                    Scan with WhatsApp Camera
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: WhatsApp Default Fallback Template & Multi-Message Rule */}
          <div className="bg-[#18191d] border border-[#2d2e36] rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-display font-extrabold text-base text-white">Default Fallback WhatsApp Template</h2>
                <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                  ⚡ Service Templates Take Priority
                </span>
              </div>
              <p className="text-xs text-slate-200 font-semibold mt-1 leading-relaxed">
                Specific service templates added under <strong className="text-amber-400">Settings ➔ Services</strong> take primary priority! This template acts as the global default fallback. Use{' '}
                <code className="bg-[#282a33] text-amber-400 font-mono px-1.5 py-0.5 rounded border border-amber-600/40">{`{{name}}`}</code> for name, and{' '}
                <code className="bg-[#282a33] text-amber-400 font-mono px-1.5 py-0.5 rounded border border-amber-600/40">{`{{product}}`}</code> for service.
              </p>
            </div>

            {/* Pro-Tip Banner for Line Space Splitting */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 font-semibold flex items-start space-x-2">
              <span className="text-base">💡</span>
              <div>
                <strong>Multi-Message Pro Tip:</strong> Leaving a <strong>1-line blank space</strong> (press Enter twice) inside your message splits the text so it sends as <strong>separate sequential WhatsApp messages</strong>!
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-amber-400 uppercase tracking-wider block">
                FALLBACK WHATSAPP MESSAGE
              </label>
              <textarea
                rows={5}
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                className="w-full bg-[#121316] border border-[#383a45] rounded-xl p-4 text-xs text-white font-mono leading-relaxed focus:border-amber-500 outline-none shadow-inner"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={saveTemplate}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-extrabold px-6 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
