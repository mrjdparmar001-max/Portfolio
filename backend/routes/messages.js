const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

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
    res.json({ data: messages });
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

    const msg = await Message.findById(req.params.id);
    if (!msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // ── Step 1: Send email FIRST, wait for result ──
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log('📧 Attempting to send email to:', msg.email);
    console.log('📧 From:', process.env.EMAIL_USER);
    console.log('📧 Pass set:', !!process.env.EMAIL_PASS);

    try {
      const info = await transporter.sendMail({
        from: `"Jaydip Parmar" <${process.env.EMAIL_USER}>`,
        to: msg.email,
        subject: `Re: ${msg.subject || 'Your Message'}`,
        text: reply, // plain text fallback
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
            <h2 style="color: #6c63ff;">Hello ${msg.name},</h2>
            <p style="color: #555;">Thank you for reaching out. Here is my reply:</p>
            <div style="background: #fff; border-left: 4px solid #6c63ff; padding: 16px 20px; border-radius: 4px; margin: 16px 0;">
              <p style="color: #333; font-size: 15px; line-height: 1.7;">${reply}</p>
            </div>
            <p style="color: #555;">Best Regards,</p>
            <p style="color: #333;"><strong>Jaydip Parmar</strong></p>
            <p style="color: #999; font-size: 12px;">This is a reply to your message: "${msg.message}"</p>
          </div>
        `,
      });

      console.log('✅ Email sent successfully! MessageId:', info.messageId);

      // ── Step 2: Save to DB only after email succeeds ──
      msg.adminReply = reply;
      msg.replied = true;
      msg.read = true;
      await msg.save();

      res.json({
        success: true,
        message: 'Reply sent and email delivered!',
        data: msg,
      });

    } catch (emailErr) {
      console.error('❌ Email failed:', emailErr.message);
      console.error('❌ Full error:', emailErr);

      // Still save reply to DB even if email fails
      msg.adminReply = reply;
      msg.replied = true;
      msg.read = true;
      await msg.save();

      // Return 500 so frontend shows error toast
      return res.status(500).json({
        message: `Email failed: ${emailErr.message}`,
      });
    }

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
