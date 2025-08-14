const db = require('./db');

exports.upsertUserByTelegram = (tg) => {
  const ex = db.prepare('SELECT * FROM users WHERE tg_id=?').get(String(tg.id));
  if (ex) return ex;
  const info = db.prepare('INSERT INTO users (tg_id, name, username) VALUES (?,?,?)')
    .run(String(tg.id), tg.first_name || tg.last_name || 'User', tg.username || null);
  return db.prepare('SELECT * FROM users WHERE id=?').get(info.lastInsertRowid);
};

exports.createEvent = (ownerId, { title, details, date, share_code }) => {
  const info = db.prepare(
    'INSERT INTO events (owner_id, title, details, date, share_code) VALUES (?,?,?,?,?)'
  ).run(ownerId, title, details || null, date || null, share_code);
  return db.prepare('SELECT * FROM events WHERE id=?').get(info.lastInsertRowid);
};

exports.getEventByCode  = (code) => db.prepare('SELECT * FROM events WHERE share_code=?').get(code);
exports.getEventById    = (id)   => db.prepare('SELECT * FROM events WHERE id=?').get(id);

exports.addParticipantIfNeeded = (eventId, userId, displayName) => {
  try {
    db.prepare('INSERT INTO participants (event_id, user_id, display_name) VALUES (?,?,?)')
      .run(eventId, userId, displayName || null);
  } catch (_) {}
};

exports.listParticipants = (eventId) => db.prepare(`
  SELECT p.id, u.tg_id, u.name, u.username, p.display_name, p.joined_at
  FROM participants p JOIN users u ON u.id=p.user_id
  WHERE p.event_id=?
  ORDER BY p.id ASC
`).all(eventId);

exports.addItem   = (eventId, { title, note }) => {
  const info = db.prepare('INSERT INTO wishlist_items (event_id, title, note) VALUES (?,?,?)')
    .run(eventId, title, note || null);
  return db.prepare('SELECT * FROM wishlist_items WHERE id=?').get(info.lastInsertRowid);
};

exports.listItemsForOwner = (eventId) => db.prepare(`
  SELECT id, title, note,
         CASE WHEN reserved_by IS NULL THEN 0 ELSE 1 END AS reserved,
         reserved_at
  FROM wishlist_items
  WHERE event_id=?
  ORDER BY id ASC
`).all(eventId);

exports.listItemsForParticipant = (eventId, viewerUserId) => db.prepare(`
  SELECT id, title, note,
         CASE WHEN reserved_by IS NULL THEN 0 ELSE 1 END AS reserved,
         CASE WHEN reserved_by = ? THEN 1 ELSE 0 END AS claimed_by_me
  FROM wishlist_items
  WHERE event_id=?
  ORDER BY id ASC
`).all(viewerUserId, eventId);

exports.claimItem = (itemId, byUserId) => {
  const now = new Date().toISOString();
  const item = db.prepare('SELECT * FROM wishlist_items WHERE id=?').get(itemId);
  if (!item) return { error: 'NOT_FOUND' };
  if (item.reserved_by) return { error: 'ALREADY_RESERVED' };
  db.prepare('UPDATE wishlist_items SET reserved_by=?, reserved_at=? WHERE id=?')
    .run(byUserId, now, itemId);
  return db.prepare('SELECT * FROM wishlist_items WHERE id=?').get(itemId);
};

exports.unclaimItem = (itemId, byUserId) => {
  const item = db.prepare('SELECT * FROM wishlist_items WHERE id=?').get(itemId);
  if (!item) return { error: 'NOT_FOUND' };
  if (item.reserved_by !== byUserId) return { error: 'FORBIDDEN' };
  db.prepare('UPDATE wishlist_items SET reserved_by=NULL, reserved_at=NULL WHERE id=?').run(itemId);
  return db.prepare('SELECT * FROM wishlist_items WHERE id=?').get(itemId);
};
