const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  email: { type: String, default: 'jaydip@example.com' },
  phone: { type: String, default: '+91 98765 43210' },
  location: { type: String, default: 'Gujarat, India' },
  resume: { type: String, default: '' },
  avatar: { type: String, default: '' },
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  twitter: { type: String, default: '' },
  yearsExperience: { type: Number, default: 3 },
  expYears:        { type: Number, default: 3 },
  expMonths:       { type: Number, default: 0 },
  expDays:         { type: Number, default: 0 },
  happyClients:    { type: Number, default: 20 },
  awardsWon:       { type: Number, default: 5 },
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
