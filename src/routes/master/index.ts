import express from 'express';

const router = express.Router();

// Example master route
router.get('/', (_req, res) => {
  res.json({ message: 'Master route is working!' });
});

export default router;