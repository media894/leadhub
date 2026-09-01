export default function IndiamartGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#18191d] w-full max-w-2xl rounded-2xl border border-[#2d2e36] shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white w-8 h-8 rounded-full flex items-center justify-center bg-[#24252b] hover:bg-[#32343e] transition-colors border border-[#383a45]"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-[#2d2e36] pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-extrabold text-lg">
            IM
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">How to get your IndiaMART CRM API Key</h2>
            <p className="text-xs text-slate-300 font-medium">Follow these simple steps in your IndiaMART seller panel</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex gap-4 p-4 rounded-xl border border-[#2d2e36] bg-[#121316]">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-neutral-950 font-black text-sm flex items-center justify-center shrink-0 shadow">
              1
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-white">Log in to IndiaMART Seller Panel</h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Open your browser and navigate to{' '}
                <a
                  href="https://seller.indiamart.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 font-bold underline hover:text-amber-300"
                >
                  seller.indiamart.com
                </a>{' '}
                and log in with your primary registered mobile number or seller account credentials.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 p-4 rounded-xl border border-[#2d2e36] bg-[#121316]">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-neutral-950 font-black text-sm flex items-center justify-center shrink-0 shadow">
              2
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-white">Navigate to Lead Manager & CRM Integration</h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                In the left sidebar menu, click on <span className="font-bold text-amber-300">"Lead Manager"</span>. Under the Lead Manager section, select <span className="font-bold text-amber-300">"CRM Integration"</span> (or "API Integration").
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 p-4 rounded-xl border border-[#2d2e36] bg-[#121316]">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-neutral-950 font-black text-sm flex items-center justify-center shrink-0 shadow">
              3
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-white">Generate or Copy your CRM Key</h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Look for the section labeled <span className="font-bold text-amber-300">"GLUSR CRM KEY / Lead Manager API Key"</span>. Click <span className="font-bold text-white">"Generate Key"</span> if you haven't created one yet, then copy the generated alphanumeric string.
              </p>
              <div className="mt-2 bg-[#1a1b20] border border-[#383a45] rounded-lg p-2.5 text-xs font-mono text-slate-300">
                Example Key format: <span className="text-amber-400 font-bold">mGlusr_CRM_Key_XXXXXX...</span>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4 p-4 rounded-xl border border-[#2d2e36] bg-[#121316]">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-neutral-950 font-black text-sm flex items-center justify-center shrink-0 shadow">
              4
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-white">Paste the Key into LeadHub</h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Paste the copied API key into LeadHub's IndiaMART API Key field. Enable <span className="font-bold text-amber-300">Auto-Sync</span> so new leads automatically flow into your dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end pt-4 border-t border-[#2d2e36]">
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-extrabold rounded-xl px-6 py-2.5 transition-colors shadow-md"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
