const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Skill = require('../models/Skill');

const defaultSkills = [
  { category: 'Frontend', items: ['React.js', 'Next.js', 'HTML5', 'CSS3', 'Tailwind CSS', 'Framer Motion'], order: 0 },
  { category: 'Backend', items: ['Node.js', 'Express.js', 'REST APIs', 'GraphQL', 'Socket.io'], order: 1 },
  { category: 'Database', items: ['MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'Firebase'], order: 2 },
  { category: 'Tools', items: ['Git', 'Docker', 'AWS', 'Figma', 'VS Code', 'Postman'], order: 3 },
];

router.get('/', async (req, res) => {
  let skills = await Skill.find().sort({ order: 1 });
  if (!skills.length) {
    skills = await Skill.insertMany(defaultSkills);
  }
  res.json(skills);
});

router.post('/', auth, async (req, res) => {
  const count = await Skill.countDocuments();
  const skill = await Skill.create({ ...req.body, order: count });
  res.status(201).json(skill);
});

router.put('/:id', auth, async (req, res) => {
  const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(skill);
});

router.delete('/:id', auth, async (req, res) => {
  await Skill.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
