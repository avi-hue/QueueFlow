const { store } = require('../src/db/inMemoryStore');

beforeEach(() => {
  store.seed();
});


afterAll(() => {
  store.reset();
});
