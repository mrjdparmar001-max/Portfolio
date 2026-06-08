const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

// ── Create transporter INSIDE a function so env vars are always loaded ──
const createTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL - faster and more reliable than service:'gmail'
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000, // 10s
    socketTimeout: 10000,
  });

// ── POST /api/messages — user sends message ──
router.post('/', async (req, res) => {
  try {
    const msg = new Message(req.body);
    await msg.save();
    res.status(201).json({ message: 'Message sent successfully!' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── GET /api/messages — admin gets all messages ──
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({ data: messages }); // wrapped in {data} to match frontend r.data
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/messages/:id/read — mark as read ──
router.put('/:id/read', auth, async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(msg);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /api/messages/:id/reply — admin replies + sends email ──
router.put('/:id/reply', auth, async (req, res) => {
  try {
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    // 1. Find message
    const msg = await Message.findById(req.params.id);
    if (!msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // 2. Save reply to DB first (fast)
    msg.adminReply = reply;
    msg.replied = true;
    msg.read = true;
    await msg.save();

    // 3. Send email (async - don't block response)
    const transporter = createTransporter();

    // Verify credentials before sending
    transporter.verify((error) => {
      if (error) {
        console.error('❌ Email transporter error:', error.message);
        // Don't fail the request - DB was already saved
      } else {
        transporter.sendMail({
          from: `"Jaydip Parmar" <${process.env.EMAIL_USER}>`,
          to: msg.email,
          subject: `Re: ${msg.subject || 'Your Message'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
              <h2 style="color: #6c63ff;">Hello ${msg.name},</h2>
              <div style="background: #fff; border-left: 4px solid #6c63ff; padding: 16px 20px; border-radius: 4px; margin: 16px 0;">
                <p style="color: #333; font-size: 15px; line-height: 1.7;">${reply}</p>
              </div>
              <p style="color: #555;">Best Regards,</p>
              <p style="color: #333;"><strong>Jaydip Parmar</strong></p>
            </div>
          `,
        }).then(() => {
          console.log(`✅ Email sent to ${msg.email}`);
        }).catch((err) => {
          console.error('❌ Email send failed:', err.message);
        });
      }
    });

    // 4. Respond immediately without waiting for email
    res.json({
      success: true,
      message: 'Reply saved. Email sending in background.',
      data: msg,
    });

  } catch (err) {
    console.error('Reply route error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/messages/:id ──
router.delete('/:id', auth, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
