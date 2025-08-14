const db = require('../src/db');
const repo = require('../src/repos');

beforeEach(() => {
  db.exec('DELETE FROM wishlist_items; DELETE FROM participants; DELETE FROM events; DELETE FROM users;');
});

test('claimItem prevents double booking', () => {
  const u1 = repo.upsertUserByTelegram({ id: 1, first_name: 'A' });
  const u2 = repo.upsertUserByTelegram({ id: 2, first_name: 'B' });
  const ev = repo.createEvent(u1.id, { title: 'Party', share_code: 'AAAAAA' });
  const item = repo.addItem(ev.id, { title: 'Gift' });
  expect(repo.claimItem(item.id, u1.id).error).toBeUndefined();
  const res = repo.claimItem(item.id, u2.id);
  expect(res.error).toBe('ALREADY_RESERVED');
});
