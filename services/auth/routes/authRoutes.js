const express = require('express');
const {
  register,
  verifyOtpController,
  login,
  me
} = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtpController);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.get('/ping', (req, res) => res.json({ message: 'Auth service is up!' }));

module.exports = router;
