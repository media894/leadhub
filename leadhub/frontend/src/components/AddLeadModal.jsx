import { useState } from 'react';
import api from '../api';

export default function AddLeadModal({ isOpen, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [product, setProduct] = useState('');
  const [message, setMessage] = useState('');
  const [queryType, setQueryType] = useState('BL');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim() && !mobile.trim()) {
      setError('Please provide at least a Lead Name or Phone number.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/leads', {
        senderName: name,
        senderCompany: company,
        senderMobile: mobile,
        senderEmail: email,
        senderCity: city,
        productName: product,
        queryMessage: message,
        queryType,
      });

      onSaved();
      onClose();
      // reset
      setName('');
      setCompany('');
      setMobile('');
      setEmail('');
      setCity('');
      setProduct('');
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create lead.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-[#1b1c20] text-slate-200 w-full max-w-lg rounded-2xl border border-[#2d2e35] shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white w-8 h-8 rounded-full flex items-center justify-center bg-[#25262c] hover:bg-[#303138] transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">➕</span>
          <h2 className="font-display font-bold text-lg text-white">Add New Lead</h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Manually enter a buyer enquiry into your Lead Manager dashboard.
        </p>

        {error && (
          <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl px-3.5 py-2.5 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#9ca3af] font-medium mb-1 block">Lead Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-[#121316] border border-[#2e2f36] rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[#9ca3af] font-medium mb-1 block">Company Name</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Sharma Enterprises"
                className="w-full bg-[#121316] border border-[#2e2f36] rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#9ca3af] font-medium mb-1 block">Mobile Number</label>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91-9876543210"
                className="w-full bg-[#121316] border border-[#2e2f36] rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[#9ca3af] font-medium mb-1 block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className="w-full bg-[#121316] border border-[#2e2f36] rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#9ca3af] font-medium mb-1 block">City / Location</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai, Maharashtra"
                className="w-full bg-[#121316] border border-[#2e2f36] rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[#9ca3af] font-medium mb-1 block">Lead Type</label>
              <select
                value={queryType}
                onChange={(e) => setQueryType(e.target.value)}
                className="w-full bg-[#121316] border border-[#2e2f36] rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
              >
                <option value="BL">Buy Lead (BL)</option>
                <option value="W">Direct Enquiry (W)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[#9ca3af] font-medium mb-1 block">Product / Service Enquired</label>
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="e.g. Box Packaging / Catalogue Design"
              className="w-full bg-[#121316] border border-[#2e2f36] rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[#9ca3af] font-medium mb-1 block">Enquiry Message Details</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter requirement details..."
              className="w-full bg-[#121316] border border-[#2e2f36] rounded-xl px-3 py-2 text-white focus:border-amber-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#2d2e35] hover:border-slate-500 text-slate-300 text-xs font-semibold rounded-xl px-4 py-2.5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold rounded-xl px-6 py-2.5 transition-colors disabled:opacity-50 shadow-md"
            >
              {saving ? 'Saving...' : 'Add Lead 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
