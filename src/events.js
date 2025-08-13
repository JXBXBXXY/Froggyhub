const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { events, eventMembers } = require('./data');
const { requireAuth, canViewEvent, canEditEvent } = require('./middleware');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const includePublic = req.query.includePublic === 'true';
  const userId = req.user.id;
  const owned = events.filter(e => e.owner_id === userId);
  const memberEvents = eventMembers
    .filter(m => m.userId === userId)
    .map(m => events.find(e => e.id === m.eventId));
  let result = [...owned, ...memberEvents];
  if (includePublic) {
    result = [...result, ...events.filter(e => e.visibility === 'public')];
  }
  const unique = Array.from(new Map(result.map(e => [e.id, e])).values());
  res.json(unique);
});

router.post('/', (req, res) => {
  const { title, description, starts_at, ends_at, visibility } = req.body;
  const event = {
    id: uuidv4(),
    title,
    description,
    starts_at: starts_at ? new Date(starts_at) : new Date(),
    ends_at: ends_at ? new Date(ends_at) : new Date(),
    owner_id: req.user.id,
    visibility: visibility || 'private',
    created_at: new Date(),
    updated_at: new Date(),
  };
  events.push(event);
  res.status(201).json(event);
});

router.get('/:id', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!canViewEvent(event, req.user)) {
    return res.status(403).json({ error: { code: 'forbidden', message: 'Cannot view event' } });
  }
  res.json(event);
});

router.patch('/:id', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!canEditEvent(event, req.user)) {
    return res.status(403).json({ error: { code: 'forbidden', message: 'Cannot edit event' } });
  }
  Object.assign(event, req.body, { updated_at: new Date() });
  res.json(event);
});

router.delete('/:id', (req, res) => {
  const index = events.findIndex(e => e.id === req.params.id);
  const event = events[index];
  if (!canEditEvent(event, req.user)) {
    return res.status(403).json({ error: { code: 'forbidden', message: 'Cannot delete event' } });
  }
  events.splice(index, 1);
  for (let i = eventMembers.length - 1; i >= 0; i--) {
    if (eventMembers[i].eventId === event.id) eventMembers.splice(i, 1);
  }
  res.status(204).end();
});

router.post('/:id/members', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!canEditEvent(event, req.user)) {
    return res.status(403).json({ error: { code: 'forbidden', message: 'Cannot modify members' } });
  }
  const { userId, memberRole } = req.body;
  const existing = eventMembers.find(m => m.eventId === event.id && m.userId === userId);
  if (existing) {
    existing.memberRole = memberRole;
  } else {
    eventMembers.push({ eventId: event.id, userId, memberRole });
  }
  res.status(201).json({ eventId: event.id, userId, memberRole });
});

router.delete('/:id/members/:userId', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!canEditEvent(event, req.user)) {
    return res.status(403).json({ error: { code: 'forbidden', message: 'Cannot modify members' } });
  }
  const idx = eventMembers.findIndex(m => m.eventId === event.id && m.userId === req.params.userId);
  if (idx !== -1) eventMembers.splice(idx, 1);
  res.status(204).end();
});

module.exports = router;
