const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Raw fields from IndiaMART Lead Manager API
    uniqueQueryId: { type: String, index: true },
    queryType: { type: String, enum: ['BL', 'W', 'OTHER'], default: 'OTHER' }, // Buy Lead vs Direct Enquiry
    senderName: String,
    senderCompany: String,
    senderMobile: String,
    senderEmail: String,
    senderCity: String,
    senderState: String,
    productName: String,
    queryMessage: String,
    queryTime: Date,

    // App-managed fields
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Converted', 'Lost'],
      default: 'New',
      index: true,
    },
    source: { type: String, default: 'IndiaMART' },

    // Outreach tracking
    emailSent: { type: Boolean, default: false },
    emailSentAt: Date,
    whatsappSent: { type: Boolean, default: false },
    whatsappSentAt: Date,

    // AI enrichment (Gemini)
    aiScore: { type: Number, default: null }, // 0-100
    aiSummary: { type: String, default: '' },
    aiScoredAt: Date,

    notes: { type: String, default: '' },
    starred: { type: Boolean, default: false },
    operator: { type: String, default: 'Unknown Operator' },
    emailValid: { type: Boolean, default: true },
    phoneFormat: { type: String, default: 'Format Only' },
  },
  { timestamps: true }
);

leadSchema.index({ user: 1, uniqueQueryId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Lead', leadSchema);
