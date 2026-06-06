const express = require('express');
const Compliment = require('../models/Compliment');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const comp = new Compliment(req.body);
    await comp.save();
    res.status(201).json({ message: 'Thank you for your compliment!' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const compliments = await Compliment.find({ approved: true }).sort({ createdAt: -1 });
    res.json(compliments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/all', auth, async (req, res) => {
  try {
    const compliments = await Compliment.find().sort({ createdAt: -1 });
    res.json(compliments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/approve', auth, async (req, res) => {
  try {
    const comp = await Compliment.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    res.json(comp);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Compliment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
