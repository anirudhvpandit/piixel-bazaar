const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const redis = require('redis');
const { generateOtp } = require('../utils/otpGenerator');
const { createUser, getUserByPhone, verifyOtp } = require('../models/userModel');

const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});
redisClient.on('error', err => console.error('Redis Client Error', err));

redisClient.connect()
  .then(() => console.log('Connected to Redis'))
  .catch(err => console.error('Redis connection error', err));


async function register(req, res) {
  const { phone, password } = req.body;
  const existing = await getUserByPhone(phone);
  if (existing) return res.status(400).json({ message: 'User exists' });

  const otp = generateOtp();
  await redisClient.setEx(`otp:${phone}`, process.env.OTP_EXPIRY, otp);
  res.json({ phone, otp }); 
}

async function verifyOtpController(req, res) {
  const { phone, code, password } = req.body;
  const stored = await redisClient.get(`otp:${phone}`);
  if (stored !== code) return res.status(400).json({ message: 'Invalid OTP' });

  const passwordHash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  await createUser({ id, phone, passwordHash, otp: { code } });
  res.json({ message: 'User registered', id });
}

async function login(req, res) {
  const { phone, password } = req.body;
  const user = await getUserByPhone(phone);
  if (!user) return res.status(400).json({ message: 'No such user' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ message: 'Wrong password' });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
}

async function me(req, res) {
  res.json({ userId: req.user.userId });
}

module.exports = { register, verifyOtpController, login, me };
