require('dotenv').config();
const path = require('path');
const express = require('express');
const api = require('./src/app');

const web = express();
web.use(express.static(path.join(__dirname)));
web.use('/api', api);

const PORT = process.env.PORT || 3000;
web.listen(PORT, () => console.log('Web+API on http://localhost:' + PORT));
