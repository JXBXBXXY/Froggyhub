const request = require('supertest');
const app = require('../src/server');
const { seed, events, eventMembers, users } = require('../src/data');

beforeEach(async () => {
  await seed();
});

async function login(email, password) {
  const res = await request(app).post('/auth/login').send({ email, password });
  return res.body.accessToken;
}

describe('auth and events', () => {
  test('register -> login -> /me', async () => {
    await request(app).post('/auth/register').send({ email: 'new@example.com', password: 'pass' }).expect(201);
    const res = await request(app).post('/auth/login').send({ email: 'new@example.com', password: 'pass' }).expect(200);
    const token = res.body.accessToken;
    await request(app).get('/me').set('Authorization', `Bearer ${token}`).expect(200);
  });

  test('access own event', async () => {
    const token = await login('user@example.com', 'userpass');
    const event = events.find(e => e.owner_id === users.find(u => u.email==='user@example.com').id && e.visibility === 'shared');
    await request(app).get(`/events/${event.id}`).set('Authorization', `Bearer ${token}`).expect(200);
  });

  test('cannot access others private', async () => {
    const token = await login('user@example.com', 'userpass');
    const admin = users.find(u=>u.email==='admin@example.com');
    const privateEvent = events.find(e => e.owner_id === admin.id && e.visibility === 'private');
    await request(app).get(`/events/${privateEvent.id}`).set('Authorization', `Bearer ${token}`).expect(403);
  });

  test('public event visible', async () => {
    const token = await login('admin@example.com', 'adminpass');
    const res = await request(app).get('/events?includePublic=true').set('Authorization', `Bearer ${token}`).expect(200);
    const publicEvent = events.find(e=>e.visibility==='public');
    expect(res.body.map(e=>e.id)).toContain(publicEvent.id);
    await request(app).get(`/events/${publicEvent.id}`).set('Authorization', `Bearer ${token}`).expect(200);
  });

  test('viewer cannot edit', async () => {
    await request(app).post('/auth/register').send({ email: 'viewer@example.com', password: 'pass' }).expect(201);
    const ownerToken = await login('user@example.com', 'userpass');
    const viewer = users.find(u=>u.email==='viewer@example.com');
    const sharedEvent = events.find(e=>e.visibility==='shared');
    await request(app)
      .post(`/events/${sharedEvent.id}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: viewer.id, memberRole: 'viewer' })
      .expect(201);
    const viewerToken = await login('viewer@example.com', 'pass');
    await request(app).get(`/events/${sharedEvent.id}`).set('Authorization', `Bearer ${viewerToken}`).expect(200);
    await request(app).patch(`/events/${sharedEvent.id}`).set('Authorization', `Bearer ${viewerToken}`).send({ title:'x'}).expect(403);
  });

  test('editor can edit', async () => {
    const userToken = await login('user@example.com', 'userpass');
    const res = await request(app).post('/events').set('Authorization', `Bearer ${userToken}`).send({ title: 'Temp', description:'', visibility:'shared' }).expect(201);
    const eventId = res.body.id;
    const admin = users.find(u=>u.email==='admin@example.com');
    await request(app).post(`/events/${eventId}/members`).set('Authorization', `Bearer ${userToken}`).send({ userId: admin.id, memberRole: 'editor' }).expect(201);
    const adminToken = await login('admin@example.com', 'adminpass');
    await request(app).patch(`/events/${eventId}`).set('Authorization', `Bearer ${adminToken}`).send({ title:'Updated'}).expect(200);
  });
});
