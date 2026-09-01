import { useState, useEffect } from 'react';
import api from '../api';

export default function ServiceFormModal({ isOpen, onClose, serviceToEdit, onSaved }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');

  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailAttachments, setEmailAttachments] = useState([]);

  const [useGlobalWhatsapp, setUseGlobalWhatsapp] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [whatsappAttachments, setWhatsappAttachments] = useState([]);

  const [uploadingEmail, setUploadingEmail] = useState(false);
  const [uploadingWa, setUploadingWa] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (serviceToEdit) {
      setName(serviceToEdit.name || '');
      setDescription(serviceToEdit.description || '');
      setKeywords(
        Array.isArray(serviceToEdit.keywords) ? serviceToEdit.keywords.join(', ') : serviceToEdit.keywords || ''
      );
      setEmailSubject(serviceToEdit.emailSubject || 'Proposal for {{product}}');
      setEmailBody(serviceToEdit.emailBody || 'Dear {{name}},');
      
      const emailList = Array.isArray(serviceToEdit.emailAttachments) && serviceToEdit.emailAttachments.length > 0
        ? serviceToEdit.emailAttachments
        : (serviceToEdit.emailAttachment?.filename ? [serviceToEdit.emailAttachment] : []);
      setEmailAttachments(emailList);

      setUseGlobalWhatsapp(!!serviceToEdit.useGlobalWhatsapp);
      setWhatsappMessage(
        serviceToEdit.whatsappMessage || 'Hi {{name}} 👋, thanks for your enquiry about {{product}}!'
      );
      const waList = Array.isArray(serviceToEdit.whatsappAttachments) && serviceToEdit.whatsappAttachments.length > 0
        ? serviceToEdit.whatsappAttachments
        : (serviceToEdit.whatsappAttachment?.filename ? [serviceToEdit.whatsappAttachment] : []);
      setWhatsappAttachments(waList);
    } else {
      setName('');
      setDescription('');
      setKeywords('');
      setEmailSubject('Proposal for {{product}}');
      setEmailBody('Dear {{name}},');
      setEmailAttachments([]);
      setUseGlobalWhatsapp(false);
      setWhatsappMessage('Hi {{name}} 👋, thanks for your enquiry about {{product}}!');
      setWhatsappAttachments([]);
    }
  }, [serviceToEdit, isOpen]);

  if (!isOpen) return null;

  async function handleFileUpload(file, target) {
    if (target === 'email' && emailAttachments.length >= 5) {
      setError('Maximum 5 email attachments allowed per service.');
      return;
    }
    if (target === 'whatsapp' && whatsappAttachments.length >= 5) {
      setError('Maximum 5 WhatsApp attachments allowed per service.');
      return;
    }

    const formData = new FormData();
    formData.append('attachment', file);

    if (target === 'email') setUploadingEmail(true);
    if (target === 'whatsapp') setUploadingWa(true);

    try {
      const { data } = await api.post('/services/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (target === 'email') setEmailAttachments((prev) => [...prev, data]);
      if (target === 'whatsapp') setWhatsappAttachments((prev) => [...prev, data]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'File upload failed.');
    } finally {
      if (target === 'email') setUploadingEmail(false);
      if (target === 'whatsapp') setUploadingWa(false);
    }
  }

  function removeEmailAttachment(idx) {
    setEmailAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  function removeWhatsappAttachment(idx) {
    setWhatsappAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Service name is required.');
      return;
    }

    setSaving(true);
    try {
      const autoKeywords = name
        .split(/[\/\,\-\_\s]+/)
        .map((k) => k.trim())
        .filter((k) => k.length >= 3);

      const payload = {
        name,
        description,
        keywords: autoKeywords,
        emailSubject,
        emailBody,
        emailAttachments,
        emailAttachment: emailAttachments[0] || { filename: '', path: '' },
        useGlobalWhatsapp,
        whatsappMessage,
        whatsappAttachments,
        whatsappAttachment: whatsappAttachments[0] || { filename: '', path: '' },
      };

      if (serviceToEdit?._id) {
        await api.put(`/services/${serviceToEdit._id}`, payload);
      } else {
        await api.post('/services', payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save service.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-amber-500/30 shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto scrollbar-thin">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white w-8 h-8 rounded-full flex items-center justify-center bg-slate-900 hover:bg-slate-800 transition-colors border border-slate-700"
        >
          ✕
        </button>

        <h2 className="font-display text-xl font-bold text-slate-100 mb-1">
          {serviceToEdit ? 'Edit Service & Proposal Template' : 'Add New Service Template'}
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Configure service keywords + custom proposal email (up to 5 attachments) & WhatsApp media.
        </p>

        {error && (
          <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* General Service Details */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-200 mb-1 block">Service Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Graphic Design & Catalogue Services"
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:border-amber-500 outline-none"
              />
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              💡 System will automatically match incoming IndiaMART leads related to this Service Name.
            </p>
          </div>

          {/* Email Template & Multi Attachments (Up to 5) */}
          <div className="space-y-3 p-4 bg-slate-950/70 rounded-xl border border-slate-800">
            <h3 className="font-extrabold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Email Proposal & Attachments (Up to 5 Files)
            </h3>
            <div>
              <label className="text-xs font-bold text-slate-200 mb-1 block">Email Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-200 mb-1 block">Email Body</label>
              <textarea
                rows={4}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full glass-input rounded-xl p-3 text-xs text-slate-100 font-mono leading-relaxed focus:border-amber-500 outline-none"
              />
              <span className="text-[11px] text-amber-400 font-mono mt-1 block">
                Placeholders: {'{{name}}'}, {'{{product}}'}, {'{{company}}'}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-200">
                  Email Attachments ({emailAttachments.length}/5 Files)
                </label>
                <span className="text-[11px] text-slate-400">PDFs, Brochures, Images, GIFs</span>
              </div>

              {/* Upload Button */}
              {emailAttachments.length < 5 && (
                <div className="mb-3">
                  <input
                    type="file"
                    id="email-attach-file"
                    accept="image/*,.gif,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'email')}
                  />
                  <label
                    htmlFor="email-attach-file"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors inline-flex items-center gap-2"
                  >
                    {uploadingEmail ? 'Uploading...' : `📎 Add Email Attachment (${emailAttachments.length + 1}/5)`}
                  </label>
                </div>
              )}

              {/* Uploaded Files Badges List */}
              <div className="space-y-2">
                {emailAttachments.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-amber-400 font-bold">#{idx + 1}</span>
                      <span className="text-slate-200 truncate font-mono">{att.filename || 'Attachment'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEmailAttachment(idx)}
                      className="text-rose-400 hover:text-rose-300 font-extrabold px-2 py-0.5 rounded hover:bg-rose-500/10 transition-colors"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* WhatsApp Template & Multi Attachments */}
          <div className="space-y-3 p-4 bg-slate-950/70 rounded-xl border border-slate-800">
            <h3 className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              WhatsApp Greeting & Media Attachments
            </h3>

            {/* Global WhatsApp Toggle */}
            <div className="flex items-center justify-between bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-100 block">
                  Use Fixed Default Template For All Services
                </span>
                <span className="text-[11px] text-slate-400">
                  Enable to use global default template instead of custom per-service message
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUseGlobalWhatsapp(!useGlobalWhatsapp)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useGlobalWhatsapp ? 'bg-amber-500' : 'bg-slate-800 border border-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useGlobalWhatsapp ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {useGlobalWhatsapp ? (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-semibold leading-relaxed">
                ⚡ <strong>Fixed Global WhatsApp Template Active:</strong> Leads matching this service will automatically receive your global default WhatsApp greeting template.
              </div>
            ) : (
              <>
                {/* Line space multi-message tip */}
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[11px] text-blue-300 font-semibold flex items-center space-x-1.5">
                  <span>💡</span>
                  <span><strong>Pro-Tip:</strong> Leave a 1-line space (Enter twice) to send as separate WhatsApp messages!</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 mb-1 block">Custom WhatsApp Message</label>
                  <textarea
                    rows={4}
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    className="w-full glass-input rounded-xl p-3 text-xs text-slate-100 font-mono leading-relaxed focus:border-amber-500 outline-none"
                  />
                  <span className="text-[11px] text-amber-400 font-mono mt-1 block">
                    Placeholders: {'{{name}}'}, {'{{product}}'}, {'{{company}}'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      WhatsApp Media Attachments ({whatsappAttachments.length}/5 Files)
                    </label>
                    <span className="text-[11px] text-slate-400">PDFs, Images, GIFs, Videos</span>
                  </div>

                  {/* Upload Button */}
                  {whatsappAttachments.length < 5 && (
                    <div className="mb-3">
                      <input
                        type="file"
                        id="wa-attach-file"
                        accept="image/*,.gif,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'whatsapp')}
                      />
                      <label
                        htmlFor="wa-attach-file"
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors inline-flex items-center gap-2"
                      >
                        {uploadingWa ? 'Uploading...' : `📷 Add WhatsApp Media (${whatsappAttachments.length + 1}/5)`}
                      </label>
                    </div>
                  )}

                  {/* Uploaded Files Badges List */}
                  <div className="space-y-2">
                    {whatsappAttachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-emerald-400 font-bold">#{idx + 1}</span>
                          <span className="text-slate-200 truncate font-mono">{att.filename || 'Media'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeWhatsappAttachment(idx)}
                          className="text-rose-400 hover:text-rose-300 font-extrabold px-2 py-0.5 rounded hover:bg-rose-500/10 transition-colors"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl px-4 py-2.5 transition-colors border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl px-6 py-2.5 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
            >
              {saving ? 'Saving Service...' : 'Save Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
