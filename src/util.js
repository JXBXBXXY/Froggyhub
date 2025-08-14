const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);
exports.newShareCode = () => nanoid();
