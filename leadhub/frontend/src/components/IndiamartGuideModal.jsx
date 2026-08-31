export default function IndiamartGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-card w-full max-w-2xl rounded-2xl border border-line shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate hover:text-ink w-8 h-8 rounded-full flex items-center justify-center bg-paper hover:bg-line transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-signal/10 text-signal flex items-center justify-center font-bold text-lg">
            IM
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-ink">How to get your IndiaMART CRM API Key</h2>
            <p className="text-xs text-slate">Follow these simple steps in your IndiaMART seller panel</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4 p-4 rounded-xl border border-line bg-paper/50">
            <div className="w-8 h-8 rounded-full bg-signal text-white font-bold text-sm flex items-center justify-center shrink-0">
              1
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-ink">Log in to IndiaMART Seller Panel</h3>
              <p className="text-xs text-slate leading-relaxed">
                Open your browser and navigate to{' '}
                <a
                  href="https://seller.indiamart.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-signal font-medium underline"
                >
                  seller.indiamart.com
                </a>{' '}
                and log in with your primary registered mobile number or seller account credentials.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 p-4 rounded-xl border border-line bg-paper/50">
            <div className="w-8 h-8 rounded-full bg-signal text-white font-bold text-sm flex items-center justify-center shrink-0">
              2
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-ink">Navigate to Lead Manager & CRM Integration</h3>
              <p className="text-xs text-slate leading-relaxed">
                In the left sidebar menu, click on <span className="font-medium text-ink">"Lead Manager"</span>. Under the Lead Manager section, select <span className="font-medium text-ink">"CRM Integration"</span> (or "API Integration").
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 p-4 rounded-xl border border-line bg-paper/50">
            <div className="w-8 h-8 rounded-full bg-signal text-white font-bold text-sm flex items-center justify-center shrink-0">
              3
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-ink">Generate or Copy your CRM Key</h3>
              <p className="text-xs text-slate leading-relaxed">
                Look for the section labeled <span className="font-medium text-ink">"GLUSR CRM KEY / Lead Manager API Key"</span>. Click <span className="font-medium text-ink">"Generate Key"</span> if you haven't created one yet, then copy the generated alphanumeric string.
              </p>
              <div className="mt-2 bg-card border border-line rounded-lg p-2 text-[11px] font-mono text-slate">
                Example Key format: <span className="text-ink font-semibold">mGlusr_CRM_Key_XXXXXX...</span>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4 p-4 rounded-xl border border-line bg-paper/50">
            <div className="w-8 h-8 rounded-full bg-signal text-white font-bold text-sm flex items-center justify-center shrink-0">
              4
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-ink">Paste the Key into LeadHub</h3>
              <p className="text-xs text-slate leading-relaxed">
                Paste the copied API key into LeadHub's IndiaMART API Key field. Enable <span className="font-medium text-ink">Auto-Sync</span> so new leads automatically flow into your dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-signal hover:bg-signalDark text-white text-sm font-medium rounded-lg px-6 py-2.5 transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
