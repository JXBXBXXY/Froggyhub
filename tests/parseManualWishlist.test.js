const parseManualWishlist = require('../parseManualWishlist');

describe('parseManualWishlist', () => {

  test('splits lines and trims values', () => {
    const raw = ' Игрушка 1 | http://example.com \nИгрушка 2|https://test.com\nИгрушка3 ';
    expect(parseManualWishlist(raw)).toEqual([
      { id: '1', name: 'Игрушка 1', url: 'http://example.com', reservedBy: null },
      { id: '2', name: 'Игрушка 2', url: 'https://test.com', reservedBy: null },
      { id: '3', name: 'Игрушка3', url: null, reservedBy: null },
    ]);
  });

  test('ignores empty lines and uses defaults', () => {
    const raw = '\n | https://gift.com \n\nГаджет|\n|\n';
    expect(parseManualWishlist(raw)).toEqual([
      { id: '1', name: 'Подарок', url: 'https://gift.com', reservedBy: null },
      { id: '2', name: 'Гаджет', url: null, reservedBy: null },
      { id: '3', name: 'Подарок', url: null, reservedBy: null },
    ]);
  });
});
