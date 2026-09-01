const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Service = require('../models/Service');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/attachments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
});

// Upload attachment route
router.post('/upload', upload.single('attachment'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    const relativePath = `/uploads/attachments/${req.file.filename}`;
    res.json({
      filename: req.file.originalname,
      path: relativePath,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    res.status(500).json({ message: 'File upload failed.', error: err.message });
  }
});

// GET all services for user
router.get('/', async (req, res) => {
  try {
    let services = await Service.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: 'Error loading services.', error: err.message });
  }
});

// POST create service
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      keywords,
      emailSubject,
      emailBody,
      emailAttachment,
      emailAttachments,
      useGlobalWhatsapp,
      whatsappMessage,
      whatsappAttachment,
      whatsappAttachments,
      isDefault,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Service name is required.' });
    }

    if (isDefault) {
      await Service.updateMany({ user: req.userId }, { isDefault: false });
    }

    const service = await Service.create({
      user: req.userId,
      name,
      description: description || '',
      keywords: Array.isArray(keywords)
        ? keywords
        : (keywords || '')
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
      emailSubject: emailSubject || undefined,
      emailBody: emailBody || undefined,
      emailAttachment: emailAttachment || {},
      emailAttachments: emailAttachments || [],
      useGlobalWhatsapp: !!useGlobalWhatsapp,
      whatsappMessage: whatsappMessage || undefined,
      whatsappAttachment: whatsappAttachment || {},
      whatsappAttachments: whatsappAttachments || [],
      isDefault: !!isDefault,
    });

    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ message: 'Could not create service.', error: err.message });
  }
});

// PUT update service
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      keywords,
      emailSubject,
      emailBody,
      emailAttachment,
      emailAttachments,
      useGlobalWhatsapp,
      whatsappMessage,
      whatsappAttachment,
      whatsappAttachments,
      isDefault,
    } = req.body;

    const service = await Service.findOne({ _id: req.params.id, user: req.userId });
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    if (isDefault && !service.isDefault) {
      await Service.updateMany({ user: req.userId }, { isDefault: false });
    }

    if (name !== undefined) service.name = name;
    if (description !== undefined) service.description = description;
    if (keywords !== undefined) {
      service.keywords = Array.isArray(keywords)
        ? keywords
        : (keywords || '')
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean);
    }
    if (emailSubject !== undefined) service.emailSubject = emailSubject;
    if (emailBody !== undefined) service.emailBody = emailBody;
    if (emailAttachment !== undefined) service.emailAttachment = emailAttachment;
    if (emailAttachments !== undefined) service.emailAttachments = emailAttachments;
    if (useGlobalWhatsapp !== undefined) service.useGlobalWhatsapp = useGlobalWhatsapp;
    if (whatsappMessage !== undefined) service.whatsappMessage = whatsappMessage;
    if (whatsappAttachment !== undefined) service.whatsappAttachment = whatsappAttachment;
    if (whatsappAttachments !== undefined) service.whatsappAttachments = whatsappAttachments;
    if (isDefault !== undefined) service.isDefault = isDefault;

    await service.save();
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: 'Could not update service.', error: err.message });
  }
});

// DELETE service
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }
    res.json({ message: 'Service deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete service.', error: err.message });
  }
});

module.exports = router;
