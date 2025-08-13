const { seed } = require('./data');
seed().then(() => {
  console.log('Seeded');
});
