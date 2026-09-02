const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Settings = require('../models/Settings');
const authMiddleware = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, isApproved: user.isApproved },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '30d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, companyName, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Master Admin check
    const ADMIN_EMAIL = 'natasha@oddinfotech.com';
    const isMasterAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const role = isMasterAdmin ? 'admin' : 'user';
    const isApproved = isMasterAdmin; // Master Admin auto-approved, normal users need Admin Approval
    const approvalToken = isApproved ? '' : crypto.randomBytes(24).toString('hex');

    const user = await User.create({
      name,
      companyName,
      email,
      password,
      role,
      isApproved,
      approvalToken,
    });

    await Settings.create({ user: user._id });

    if (!isApproved) {
      const host = req.headers.host || 'localhost:5000';
      const protocol = req.protocol || 'http';
      const approvalUrl = `${protocol}://${host}/api/auth/approve-token/${approvalToken}`;

      // Send instant Email Notification to Admin with 1-Click Approval Link
      emailService.sendAdminRegistrationAlert({ newUser: user, approvalUrl });

      return res.status(201).json({
        message: `Registration submitted! An email approval request has been sent to Admin (${ADMIN_EMAIL}). You will receive an email as soon as your access is approved.`,
        pendingApproval: true,
        user: { id: user._id, name: user.name, email: user.email, isApproved: false },
      });
    }

    res.status(201).json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not create account.', error: err.message });
  }
});

// GET /api/auth/approve-token/:token (1-Click Approval Link from Email)
router.get('/approve-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ approvalToken: token });

    if (!user) {
      return res.send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0b0f19; color: #fff; min-height: 100vh;">
          <h2 style="color: #ef4444;">⚠️ Invalid or Expired Approval Link</h2>
          <p style="color: #cbd5e1;">This user approval link has already been used or is invalid.</p>
          <a href="http://localhost:5173/settings" style="color: #f59e0b; font-weight: bold; text-decoration: underline;">Return to LeadHub Settings</a>
        </div>
      `);
    }

    user.isApproved = true;
    user.approvalToken = '';
    await user.save();

    // Send welcome notice email to user
    emailService.sendUserApprovalNotice({ user });

    res.send(`
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 60px 20px; background: #0b0f19; color: #fff; min-height: 100vh;">
        <div style="max-width: 500px; margin: 0 auto; background: #1e293b; padding: 40px; border-radius: 16px; border: 1px solid #10b981; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
          <h1 style="color: #10b981; margin-bottom: 10px; font-size: 24px;">User Approved Successfully!</h1>
          <p style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">
            Access has been granted to <strong>${user.name}</strong> (<span style="color: #f59e0b;">${user.email}</span>).
          </p>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 15px;">
            A confirmation welcome email has been automatically sent to the user.
          </p>
          <div style="margin-top: 30px;">
            <a href="http://localhost:5173/settings" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; display: inline-block;">
              Open LeadHub Dashboard
            </a>
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    res.status(500).send(`<h2>Error approving user: ${err.message}</h2>`);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    const ADMIN_EMAIL = 'natasha@oddinfotech.com';
    const isMasterAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();

    if (isMasterAdmin) {
      if (password !== 'OddInfotech@2026') {
        const isMatch = user ? await user.comparePassword(password) : false;
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid password for Master Admin.' });
        }
      }

      if (!user) {
        user = await User.create({
          name: 'Natasha Admin',
          email: ADMIN_EMAIL,
          companyName: 'Odd Infotech',
          password: 'OddInfotech@2026',
          role: 'admin',
          isApproved: true,
        });
        await Settings.create({ user: user._id });
      } else {
        let needsSave = false;
        if (user.role !== 'admin') {
          user.role = 'admin';
          needsSave = true;
        }
        if (!user.isApproved) {
          user.isApproved = true;
          needsSave = true;
        }
        if (password === 'OddInfotech@2026') {
          const isMatch = await user.comparePassword('OddInfotech@2026');
          if (!isMatch) {
            user.password = 'OddInfotech@2026';
            needsSave = true;
          }
        }
        if (needsSave) {
          await user.save();
        }
      }
    } else {
      if (!user) {
        return res.status(404).json({
          message: 'Account not found. Please click "Create an account" below to sign up.',
          notRegistered: true,
        });
      }

      if (!(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid password. Please check your password and try again.' });
      }

      // Check if user account was rejected by Admin
      if (user.isRejected) {
        return res.status(403).json({
          message: '❌ Your account registration has been REJECTED by Master Admin. Access denied.',
          isRejected: true,
        });
      }

      // Check if user is approved by Admin
      if (!user.isApproved && user.role !== 'admin') {
        return res.status(403).json({
          message: 'Your account is pending Master Admin approval (natasha@oddinfotech.com). Access will be granted once approved.',
          pendingApproval: true,
        });
      }
    }

    res.json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        role: user.role,
        isApproved: user.isApproved,
        isRejected: user.isRejected,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed.', error: err.message });
  }
});

// GET /api/auth/users (List registered users needing approval, excluding Master Admin)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const caller = await User.findById(req.userId);
    const isAdmin = caller && (caller.role === 'admin' || caller.email.toLowerCase() === 'natasha@oddinfotech.com');
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access Denied: Only Admin can view user list.' });
    }
    const users = await User.find({ email: { $ne: 'natasha@oddinfotech.com' } }, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch users.', error: err.message });
  }
});

// PUT /api/auth/users/:id/approve (Toggle Approval)
router.put('/users/:id/approve', authMiddleware, async (req, res) => {
  try {
    const caller = await User.findById(req.userId);
    const isAdmin = caller && (caller.role === 'admin' || caller.email.toLowerCase() === 'natasha@oddinfotech.com');
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access Denied: Only Admin can approve user access.' });
    }

    const { isApproved, isRejected } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'Target user not found.' });

    if (isRejected) {
      targetUser.isRejected = true;
      targetUser.isApproved = false;
    } else {
      targetUser.isApproved = Boolean(isApproved);
      if (targetUser.isApproved) {
        targetUser.isRejected = false;
      }
    }
    await targetUser.save();

    if (targetUser.isApproved) {
      emailService.sendUserApprovalNotice({ user: targetUser });
    }

    res.json({
      message: `User ${targetUser.email} has been ${targetUser.isRejected ? 'Rejected ❌' : targetUser.isApproved ? 'Approved ✓' : 'Revoked ✕'}.`,
      user: targetUser,
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not update user approval.', error: err.message });
  }
});

// PUT /api/auth/users/:id/reject (Reject User Registration)
router.put('/users/:id/reject', authMiddleware, async (req, res) => {
  try {
    const caller = await User.findById(req.userId);
    const isAdmin = caller && (caller.role === 'admin' || caller.email.toLowerCase() === 'natasha@oddinfotech.com');
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access Denied: Only Admin can reject users.' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'Target user not found.' });

    targetUser.isRejected = true;
    targetUser.isApproved = false;
    await targetUser.save();

    res.json({
      message: `User ${targetUser.email} registration has been Rejected ❌.`,
      user: targetUser,
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not reject user.', error: err.message });
  }
});

// DELETE /api/auth/users/:id (Delete User Account)
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    const caller = await User.findById(req.userId);
    const isAdmin = caller && (caller.role === 'admin' || caller.email.toLowerCase() === 'natasha@oddinfotech.com');
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access Denied: Only Admin can delete user accounts.' });
    }

    const targetUser = await User.findByIdAndDelete(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'Target user not found.' });

    // Clean up user's settings, leads, and services
    await Settings.deleteMany({ user: req.params.id });
    const Lead = require('../models/Lead');
    const Service = require('../models/Service');
    await Lead.deleteMany({ user: req.params.id });
    await Service.deleteMany({ user: req.params.id });

    res.json({ message: `User ${targetUser.email} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete user.', error: err.message });
  }
});

module.exports = router;
