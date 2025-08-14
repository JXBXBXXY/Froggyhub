const express = require('express');
const cookieParser = require('cookie-parser');
const requireTelegram = require('./middlewares/requireTelegram');
const routes = require('./routes');

const app = express();
app.use(express.json());
app.use(cookieParser());

const BOT_TOKEN = process.env.BOT_TOKEN;
app.use(requireTelegram(BOT_TOKEN));
app.use(routes);

module.exports = app;
