const mongoose = require('mongoose');

// Every field here is filled in manually by the user from the Settings UI.
// Nothing is pre-filled or shared across accounts - each user connects
// their own IndiaMART, SMTP/IMAP, WhatsApp and Gemini credentials.
const settingsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    indiamart: {
      apiKey: { type: String, default: '' }, // encrypted at rest
      crmKey: { type: String, default: '' }, // encrypted at rest (IndiaMART CRM key, if used)
      connected: { type: Boolean, default: false },
      lastSyncAt: { type: Date, default: null },
      autoSyncEnabled: { type: Boolean, default: false },
      syncIntervalMinutes: { type: Number, default: 5 },
    },

    smtp: {
      host: { type: String, default: '' },
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false },
      user: { type: String, default: '' },
      pass: { type: String, default: '' }, // encrypted at rest
      fromName: { type: String, default: 'Odd Infotech' },
      connected: { type: Boolean, default: false },
    },

    imap: {
      host: { type: String, default: '' },
      port: { type: Number, default: 993 },
      user: { type: String, default: '' },
      pass: { type: String, default: '' }, // encrypted at rest
      connected: { type: Boolean, default: false },
    },

    whatsapp: {
      sessionActive: { type: Boolean, default: false },
      connectedNumber: { type: String, default: '' },
      lastQrAt: { type: Date, default: null },
    },

    gemini: {
      apiKey: { type: String, default: '' }, // encrypted at rest
      connected: { type: Boolean, default: false },
      scoringEnabled: { type: Boolean, default: true },
    },

    templates: {
      emailSubject: {
        type: String,
        default: 'Proposal for {{product}}',
      },
      emailBody: {
        type: String,
        default: 'Dear {{name}},',
      },
      whatsappGreeting: {
        type: String,
        default:
          'Hi {{name}} 👋, thanks for your enquiry about {{product}}!',
      },
    },

    automation: {
      autoEmailEnabled: { type: Boolean, default: true },
      autoWhatsappEnabled: { type: Boolean, default: true },
      autoScoringEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
