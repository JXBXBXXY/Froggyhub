const crypto = require('crypto');

function checkTelegramAuth(initData, botToken) {
  const url = new URLSearchParams(initData);
  const hash = url.get('hash');
  url.delete('hash');
  const arr = [];
  for (const [k,v] of url.entries()) arr.push(`${k}=${v}`);
  arr.sort();
  const dataCheck = arr.join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheck).digest('hex');
  return hmac === hash;
}

function parseUser(initData) {
  const url = new URLSearchParams(initData);
  const u = url.get('user');
  return u ? JSON.parse(u) : null;
}

module.exports = { checkTelegramAuth, parseUser };
