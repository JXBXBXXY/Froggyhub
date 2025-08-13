const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// In-memory data stores
let users = [];
let events = [];
let eventMembers = []; // {eventId, userId, memberRole}
let refreshTokens = new Map(); // token -> userId

function reset() {
  users.length = 0;
  events.length = 0;
  eventMembers.length = 0;
  refreshTokens = new Map();
}

async function seed() {
  reset();
  const adminId = uuidv4();
  const userId = uuidv4();
  users.push({
    id: adminId,
    email: 'admin@example.com',
    password_hash: await bcrypt.hash('adminpass', 10),
    name: 'Admin',
    role: 'admin',
    email_verified_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  });
  users.push({
    id: userId,
    email: 'user@example.com',
    password_hash: await bcrypt.hash('userpass', 10),
    name: 'User',
    role: 'user',
    email_verified_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  });
  const event1 = {
    id: uuidv4(),
    title: 'Private Event',
    description: 'Admin only',
    starts_at: new Date(),
    ends_at: new Date(),
    owner_id: adminId,
    visibility: 'private',
    created_at: new Date(),
    updated_at: new Date(),
  };
  const event2 = {
    id: uuidv4(),
    title: 'Shared Event',
    description: 'Shared with admin as viewer',
    starts_at: new Date(),
    ends_at: new Date(),
    owner_id: userId,
    visibility: 'shared',
    created_at: new Date(),
    updated_at: new Date(),
  };
  const event3 = {
    id: uuidv4(),
    title: 'Public Event',
    description: 'Public',
    starts_at: new Date(),
    ends_at: new Date(),
    owner_id: userId,
    visibility: 'public',
    created_at: new Date(),
    updated_at: new Date(),
  };
  events.push(event1, event2, event3);
  eventMembers.push({ eventId: event2.id, userId: adminId, memberRole: 'viewer' });
}

module.exports = {
  users,
  events,
  eventMembers,
  refreshTokens,
  reset,
  seed,
};
