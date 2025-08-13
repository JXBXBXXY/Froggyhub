const express = require('express');
const bodyParser = require('body-parser');
const authRouter = require('./auth');
const eventsRouter = require('./events');
const { seed } = require('./data');

const app = express();
app.use(bodyParser.json());
app.use('/auth', authRouter);
app.use('/events', eventsRouter);
app.get('/me', require('./middleware').requireAuth, (req, res) => {
  res.json({ id: req.user.id, role: req.user.role });
});

const port = process.env.PORT || 3000;

if (require.main === module) {
  seed().then(() => {
    app.listen(port, () => console.log(`Server running on ${port}`));
  });
}

module.exports = app;
