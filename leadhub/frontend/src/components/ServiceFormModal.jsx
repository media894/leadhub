import { useState, useEffect } from 'react';
import api from '../api';

export default function ServiceFormModal({ isOpen, onClose, serviceToEdit, onSaved }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');

  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailAttachment, setEmailAttachment] = useState(null);

  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [whatsappAttachment, setWhatsappAttachment] = useState(null);

  const [uploadingEmail, setUploadingEmail] = useState(false);
  const [uploadingWa, setUploadingWa] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sync state whenever serviceToEdit or isOpen changes
  useEffect(() => {
    if (serviceToEdit) {
      setName(serviceToEdit.name || '');
      setDescription(serviceToEdit.description || '');
      setKeywords(
        Array.isArray(serviceToEdit.keywords) ? serviceToEdit.keywords.join(', ') : serviceToEdit.keywords || ''
      );
      setEmailSubject(serviceToEdit.emailSubject || 'Proposal for {{product}}');
      setEmailBody(serviceToEdit.emailBody || 'Dear {{name}},');
      setEmailAttachment(
        serviceToEdit.emailAttachment?.filename ? serviceToEdit.emailAttachment : { filename: '', path: '' }
      );
      setWhatsappMessage(
        serviceToEdit.whatsappMessage ||
          'Hi {{name}} 👋, thanks for your enquiry about {{product}}!'
      );
      setWhatsappAttachment(
        serviceToEdit.whatsappAttachment?.filename ? serviceToEdit.whatsappAttachment : { filename: '', path: '' }
      );
    } else {
      setName('');
      setDescription('');
      setKeywords('');
      setEmailSubject('Proposal for {{product}}');
      setEmailBody('Dear {{name}},');
      setEmailAttachment({ filename: '', path: '' });
      setWhatsappMessage('Hi {{name}} 👋, thanks for your enquiry about {{product}}!');
      setWhatsappAttachment({ filename: '', path: '' });
    }
  }, [serviceToEdit, isOpen]);

  if (!isOpen) return null;

  async function handleFileUpload(file, target) {
    const formData = new FormData();
    formData.append('attachment', file);

    if (target === 'email') setUploadingEmail(true);
    if (target === 'whatsapp') setUploadingWa(true);

    try {
      const { data } = await api.post('/services/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (target === 'email') setEmailAttachment(data);
      if (target === 'whatsapp') setWhatsappAttachment(data);
    } catch (err) {
      setError(err.response?.data?.message || 'File upload failed.');
    } finally {
      if (target === 'email') setUploadingEmail(false);
      if (target === 'whatsapp') setUploadingWa(false);
    }
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
      const payload = {
        name,
        description,
        keywords: keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        emailSubject,
        emailBody,
        emailAttachment,
        whatsappMessage,
        whatsappAttachment,
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
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-100 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 transition-colors"
        >
          ✕
        </button>

        <h2 className="font-extrabold text-xl text-slate-100 mb-1">
          {serviceToEdit ? `Edit Service: ${serviceToEdit.name || ''}` : 'Add New Service'}
        </h2>
        <p className="text-xs text-slate-300 font-semibold mb-6">
          Define email/WhatsApp templates & file attachments to auto-send whenever a lead asks about this service.
        </p>

        {error && (
          <div className="text-xs text-rose-300 bg-rose-500/20 border border-rose-500/40 rounded-xl px-4 py-3 mb-4 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Service info */}
          <div className="space-y-3 p-4 bg-slate-950/70 rounded-xl border border-slate-800">
            <h3 className="font-extrabold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Service Details
            </h3>
            <div>
              <label className="text-xs font-bold text-slate-200 mb-1 block">Service Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Web Development / Solar Installation"
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-200 mb-1 block">Keywords (comma separated)</label>
              <input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="website, web design, app development"
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-amber-500 outline-none"
              />
              <span className="text-[11px] text-slate-300 font-medium mt-1 block">
                Incoming IndiaMART product names matching these keywords will trigger this service's templates.
              </span>
            </div>
          </div>

          {/* Email Template & Attachment */}
          <div className="space-y-3 p-4 bg-slate-950/70 rounded-xl border border-slate-800">
            <h3 className="font-extrabold text-xs text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Email Template & Attachment
            </h3>
            <div>
              <label className="text-xs font-bold text-slate-200 mb-1 block">Email Subject</label>
              <input
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
              <label className="text-xs font-bold text-slate-200 mb-1 block">
                Email Attachment (GIF, Image, PDF, Brochure)
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="email-attach-file"
                    accept="image/*,.gif,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'email')}
                  />
                  <label
                    htmlFor="email-attach-file"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    {uploadingEmail ? 'Uploading...' : '🖼️ Choose Email File (GIF / Image / PDF)'}
                  </label>
                  {emailAttachment?.filename ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                      <span>📄 {emailAttachment.filename}</span>
                      <button
                        type="button"
                        onClick={() => setEmailAttachment({ filename: '', path: '' })}
                        className="text-rose-400 font-bold hover:underline"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">No file attached</span>
                  )}
                </div>
                {emailAttachment?.path && /\.(gif|png|jpg|jpeg|webp)$/i.test(emailAttachment.filename || emailAttachment.path) && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-slate-900 rounded-xl border border-slate-800 w-fit">
                    <img
                      src={emailAttachment.path.startsWith('http') ? emailAttachment.path : `http://localhost:5000${emailAttachment.path}`}
                      alt="Email GIF Preview"
                      className="h-16 w-24 object-contain rounded border border-slate-700 bg-slate-950"
                    />
                    <span className="text-[11px] text-slate-300 font-medium">✨ Animated GIF / Image preview for email</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* WhatsApp Template & Attachment */}
          <div className="space-y-3 p-4 bg-slate-950/70 rounded-xl border border-slate-800">
            <h3 className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              WhatsApp Greeting & Media Attachment
            </h3>

            {/* Line space multi-message tip */}
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[11px] text-blue-300 font-semibold flex items-center space-x-1.5">
              <span>💡</span>
              <span><strong>Pro-Tip:</strong> Leave a 1-line space (Enter twice) to send as separate WhatsApp messages!</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-200 mb-1 block">WhatsApp Message</label>
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
              <label className="text-xs font-bold text-slate-200 mb-1 block">
                WhatsApp Attachment (GIF, Image, PDF, Brochure)
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="wa-attach-file"
                    accept="image/*,.gif,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'whatsapp')}
                  />
                  <label
                    htmlFor="wa-attach-file"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    {uploadingWa ? 'Uploading...' : '📷 Choose WhatsApp Media (GIF / Image / PDF)'}
                  </label>
                  {whatsappAttachment?.filename ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                      <span>📄 {whatsappAttachment.filename}</span>
                      <button
                        type="button"
                        onClick={() => setWhatsappAttachment({ filename: '', path: '' })}
                        className="text-rose-400 font-bold hover:underline"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">No media attached</span>
                  )}
                </div>
                {whatsappAttachment?.path && /\.(gif|png|jpg|jpeg|webp)$/i.test(whatsappAttachment.filename || whatsappAttachment.path) && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-slate-900 rounded-xl border border-slate-800 w-fit">
                    <img
                      src={whatsappAttachment.path.startsWith('http') ? whatsappAttachment.path : `http://localhost:5000${whatsappAttachment.path}`}
                      alt="WhatsApp GIF Preview"
                      className="h-16 w-24 object-contain rounded border border-slate-700 bg-slate-950"
                    />
                    <span className="text-[11px] text-slate-300 font-medium">✨ Animated GIF / Image preview for WhatsApp</span>
                  </div>
                )}
              </div>
            </div>
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
