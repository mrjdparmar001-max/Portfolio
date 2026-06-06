const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  category: { type: String, required: true },
  items: [String],
  order: { type: Number, default: 0 },
});

module.exports = mongoose.model('Skill', skillSchema);
