const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const { users, refreshTokens } = require('./data');

const router = express.Router();
router.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh-secret';

function generateAccess(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
}
function generateRefresh(user) {
  const token = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });
  refreshTokens.set(token, user.id);
  return token;
}

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: { code: 'invalid', message: 'Email and password required' } });
  }
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: { code: 'conflict', message: 'Email already exists' } });
  }
  const user = {
    id: uuidv4(),
    email,
    password_hash: await bcrypt.hash(password, 10),
    name: name || '',
    role: 'user',
    email_verified_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };
  users.push(user);
  res.status(201).json({ id: user.id, email: user.email });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid credentials' } });
  }
  const accessToken = generateAccess(user);
  const refreshToken = generateRefresh(user);
  res.json({ accessToken, refreshToken });
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || !refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid refresh' } });
  }
  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find(u => u.id === payload.id);
    if (!user) throw new Error('not found');
    const accessToken = generateAccess(user);
    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid refresh' } });
  }
});

router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) refreshTokens.delete(refreshToken);
  res.status(204).end();
});

module.exports = router;
