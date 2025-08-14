const request = require('supertest');
const crypto = require('crypto');
process.env.BOT_TOKEN = 'TEST_TOKEN';
const app = require('../src/app');
const db = require('../src/db');

function sign(user) {
  const params = new URLSearchParams();
  params.set('user', JSON.stringify(user));
  const dataCheck = [`user=${params.get('user')}`].sort().join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(process.env.BOT_TOKEN).digest();
  const hash = crypto.createHmac('sha256', secret).update(dataCheck).digest('hex');
  params.set('hash', hash);
  return params.toString();
}

beforeEach(() => {
  db.exec('DELETE FROM wishlist_items; DELETE FROM participants; DELETE FROM events; DELETE FROM users;');
});

test('owner view masks reserver identity', async () => {
  const owner = { id: 1, first_name: 'Owner' };
  const guest = { id: 2, first_name: 'Guest' };
  const initOwner = sign(owner);
  const initGuest = sign(guest);

  const evRes = await request(app)
    .post('/events')
    .set('X-Telegram-Init-Data', initOwner)
    .send({ title: 'Party' });
  const eventId = evRes.body.id;

  const itemRes = await request(app)
    .post(`/events/${eventId}/items`)
    .set('X-Telegram-Init-Data', initOwner)
    .send({ title: 'Gift' });
  const itemId = itemRes.body.id;

  await request(app)
    .post(`/items/${itemId}/claim`)
    .set('X-Telegram-Init-Data', initGuest);

  const ownerView = await request(app)
    .get(`/events/${eventId}/owner`)
    .set('X-Telegram-Init-Data', initOwner);

  expect(ownerView.status).toBe(200);
  expect(ownerView.body.items[0]).toHaveProperty('reserved', 1);
  expect(ownerView.body.items[0]).not.toHaveProperty('reserved_by');
});

test('unclaim only allowed for reserver', async () => {
  const owner = { id: 1, first_name: 'Owner' };
  const guest = { id: 2, first_name: 'Guest' };
  const other = { id: 3, first_name: 'Other' };
  const initOwner = sign(owner);
  const initGuest = sign(guest);
  const initOther = sign(other);

  const evRes = await request(app)
    .post('/events')
    .set('X-Telegram-Init-Data', initOwner)
    .send({ title: 'Party' });
  const eventId = evRes.body.id;

  const itemRes = await request(app)
    .post(`/events/${eventId}/items`)
    .set('X-Telegram-Init-Data', initOwner)
    .send({ title: 'Gift' });
  const itemId = itemRes.body.id;

  await request(app)
    .post(`/items/${itemId}/claim`)
    .set('X-Telegram-Init-Data', initGuest);

  const bad = await request(app)
    .post(`/items/${itemId}/unclaim`)
    .set('X-Telegram-Init-Data', initOther);
  expect(bad.status).toBe(403);

  const ok = await request(app)
    .post(`/items/${itemId}/unclaim`)
    .set('X-Telegram-Init-Data', initGuest);
  expect(ok.status).toBe(200);
  expect(ok.body.claimed_by_me).toBe(false);
});
