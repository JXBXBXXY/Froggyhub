const { checkTelegramAuth, parseUser } = require('../telegramAuth');

module.exports = function requireTelegram(botToken) {
  return (req, res, next) => {
    const initData = req.header('X-Telegram-Init-Data');
    if (!initData || !checkTelegramAuth(initData, botToken)) {
      return res.status(401).json({ error: { code: 'UNAUTH', message: 'Invalid Telegram signature' } });
    }
    const tgUser = parseUser(initData);
    if (!tgUser) return res.status(401).json({ error: { code: 'UNAUTH', message: 'No user' } });
    req.tgUser = tgUser;
    next();
  };
};
