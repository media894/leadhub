import React, { useState, useEffect } from 'react';
import api from '../api';

export default function AiProposalModal({ lead, onClose, onActionSuccess }) {
  const [activeTab, setActiveTab] = useState('whatsapp'); // 'whatsapp' or 'email'
  const [proposalText, setProposalText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const generateProposal = (type) => {
    setGenerating(true);
    const clientName = lead.senderName || 'Valued Customer';
    const companyName = lead.senderCompany ? ` (${lead.senderCompany})` : '';
    const product = lead.queryProductName || lead.subject || 'your requested services';
    const location = lead.senderCity ? ` in ${lead.senderCity}` : '';

    let draft = '';
    if (type === 'whatsapp') {
      draft = `Hello ${clientName}${companyName}! 👋

Thank you for reaching out regarding *${product}*${location}. We received your inquiry via IndiaMART.

We specialize in high-quality solutions tailored to your requirements with competitive pricing and quick delivery.

Would you be available for a quick call today to discuss details & pricing?

Best regards,
*Sales Team*`;
    } else {
      draft = `Dear ${clientName}${companyName},

Thank you for your interest in our products/services regarding "${product}".

We have received your requirement submitted via IndiaMART${location}. Our team has reviewed your specifications and would love to share a formal quotation and proposal with you.

Key Highlights of working with us:
- Premium Industry Quality & Warranty
- Customized Specs tailored to your needs
- Express Delivery & Dedicated Support

Please find attached our business portfolio. Feel free to reply to this email or contact us directly at your earliest convenience.

Warm regards,
Sales & Client Relations Team`;
    }

    setTimeout(() => {
      setProposalText(draft);
      setGenerating(false);
    }, 400);
  };

  useEffect(() => {
    if (lead) {
      generateProposal(activeTab);
    }
  }, [lead, activeTab]);

  const handleSend = async () => {
    if (!lead || !proposalText) return;
    setSending(true);
    setStatusMsg('');

    try {
      if (activeTab === 'email') {
        await api.post(`/leads/${lead._id}/action`, { type: 'email' });
        setStatusMsg('✅ Proposal email sent successfully!');
      } else {
        await api.post(`/leads/${lead._id}/action`, { type: 'whatsapp' });
        setStatusMsg('✅ WhatsApp proposal message dispatched!');
      }
      if (onActionSuccess) onActionSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to send:', err);
      setStatusMsg('❌ Action failed. Please verify your SMTP/WhatsApp settings.');
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(proposalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-amber-500/30 p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 text-lg border border-amber-500/30">✨</span>
            <div>
              <h3 className="text-lg font-bold text-slate-100">AI Quick Proposal Generator</h3>
              <p className="text-xs text-slate-400">Customized for <span className="text-amber-400 font-semibold">{lead.senderName || 'Lead'}</span> ({lead.queryProductName || 'Inquiry'})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl font-bold p-1 hover:bg-slate-800 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher: WhatsApp vs Email */}
        <div className="flex items-center space-x-2 mb-4 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>💬 WhatsApp Greeting</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'email'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📧 Email Proposal</span>
          </button>
        </div>

        {/* AI Proposal Text Editor */}
        <div className="relative mb-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Generated Draft (Editable):</span>
            <button
              onClick={() => generateProposal(activeTab)}
              disabled={generating}
              className="text-amber-400 hover:underline flex items-center space-x-1 focus:outline-none"
            >
              <span>{generating ? '⏳ Generating...' : '🔄 Regenerate Draft'}</span>
            </button>
          </div>

          <textarea
            value={proposalText}
            onChange={(e) => setProposalText(e.target.value)}
            rows={8}
            className="w-full glass-input rounded-xl p-3 text-xs text-slate-100 font-mono resize-none focus:ring-2 focus:ring-amber-500 focus:outline-none"
            placeholder="AI generating proposal..."
          />
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div className={`p-3 rounded-xl text-xs font-medium mb-4 ${statusMsg.startsWith('✅') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
            {statusMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={handleCopy}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-700 flex items-center space-x-1"
          >
            <span>{copied ? '✅ Copied!' : '📋 Copy Draft'}</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || generating}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center space-x-2 ${
                activeTab === 'whatsapp'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
              }`}
            >
              <span>{sending ? 'Sending...' : `Send ${activeTab === 'whatsapp' ? 'WhatsApp' : 'Email'}`}</span>
              <span>🚀</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
