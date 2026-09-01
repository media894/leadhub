const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    keywords: [{ type: String }],
    
    // Email Template & Attachments (Up to 5 files)
    emailSubject: {
      type: String,
      default: 'Proposal for {{product}}',
    },
    emailBody: {
      type: String,
      default: 'Dear {{name}},',
    },
    emailAttachments: [
      {
        filename: { type: String, default: '' },
        path: { type: String, default: '' },
        mimetype: { type: String, default: '' },
        size: { type: Number, default: 0 },
      },
    ],

    // WhatsApp Template & Attachments (Up to 5 files)
    whatsappMessage: {
      type: String,
      default: 'Hi {{name}} 👋, thanks for your enquiry about {{product}}!',
    },
    whatsappAttachments: [
      {
        filename: { type: String, default: '' },
        path: { type: String, default: '' },
        mimetype: { type: String, default: '' },
        size: { type: Number, default: 0 },
      },
    ],

    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
