const jwt = require('jsonwebtoken');
const { events, eventMembers } = require('./data');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Missing token' } });
  }
  try {
    const token = auth.substring(7);
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid token' } });
  }
}

function canViewEvent(event, user) {
  if (!event) return false;
  if (event.owner_id === user.id) return true;
  if (event.visibility === 'public') return true;
  const membership = eventMembers.find(m => m.eventId === event.id && m.userId === user.id);
  return !!membership; // viewer or editor
}

function canEditEvent(event, user) {
  if (!event) return false;
  if (user.role === 'admin') return true;
  if (event.owner_id === user.id) return true;
  const membership = eventMembers.find(m => m.eventId === event.id && m.userId === user.id);
  return membership && membership.memberRole === 'editor';
}

module.exports = { requireAuth, canViewEvent, canEditEvent };
