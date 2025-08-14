const express = require('express');
const { newShareCode } = require('./util');
const repo = require('./repos');
const db = require('./db');
const router = express.Router();

router.use((req, _res, next) => { req.user = repo.upsertUserByTelegram(req.tgUser); next(); });

router.post('/events', (req, res) => {
  const { title, details, date } = req.body || {};
  if (!title) return res.status(400).json({ error: { code: 'BAD_REQ', message: 'title required' } });
  const ev = repo.createEvent(req.user.id, { title, details, date, share_code: newShareCode() });
  res.status(201).json(ev);
});

router.get('/me/events', (req, res) => {
  const rows = db.prepare('SELECT id, title, share_code, created_at FROM events WHERE owner_id=? ORDER BY id DESC')
    .all(req.user.id);
  res.json(rows);
});

router.get('/events/by-code/:code', (req, res) => {
  const ev = repo.getEventByCode(req.params.code.toUpperCase());
  if (!ev) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Event not found' } });
  repo.addParticipantIfNeeded(ev.id, req.user.id, req.tgUser.first_name || req.tgUser.username);
  res.json({ event: { id: ev.id, title: ev.title, details: ev.details, date: ev.date, share_code: ev.share_code },
             items: repo.listItemsForParticipant(ev.id, req.user.id) });
});

router.get('/events/:id/owner', (req, res) => {
  const ev = repo.getEventById(Number(req.params.id));
  if (!ev) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  if (ev.owner_id !== req.user.id) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  res.json({ event: { id: ev.id, title: ev.title, details: ev.details, date: ev.date, share_code: ev.share_code },
             participants: repo.listParticipants(ev.id),
             items: repo.listItemsForOwner(ev.id) });
});

router.post('/events/:id/items', (req, res) => {
  const ev = repo.getEventById(Number(req.params.id));
  if (!ev) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  if (ev.owner_id !== req.user.id) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  const { title, note } = req.body || {};
  if (!title) return res.status(400).json({ error: { code: 'BAD_REQ', message: 'title required' } });
  res.status(201).json(repo.addItem(ev.id, { title, note }));
});

router.post('/items/:itemId/claim', (req, res) => {
  const r = repo.claimItem(Number(req.params.itemId), req.user.id);
  if (r.error === 'NOT_FOUND') return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  if (r.error === 'ALREADY_RESERVED') return res.status(409).json({ error: { code: 'ALREADY_RESERVED' } });
  res.json({ id: r.id, title: r.title, note: r.note, reserved: !!r.reserved_by, claimed_by_me: r.reserved_by === req.user.id });
});

router.post('/items/:itemId/unclaim', (req, res) => {
  const r = repo.unclaimItem(Number(req.params.itemId), req.user.id);
  if (r.error === 'NOT_FOUND') return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  if (r.error === 'FORBIDDEN')   return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  res.json({ id: r.id, title: r.title, note: r.note, reserved: !!r.reserved_by, claimed_by_me: false });
});

module.exports = router;
