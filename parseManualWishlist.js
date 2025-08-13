function parseManualWishlist(raw) {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .map((line, idx) => {
      const [name, url] = line.split('|').map(x => x && x.trim());
      return { id: String(idx + 1), name: name || 'Подарок', url: url || null, reservedBy: null };
    });
}

module.exports = parseManualWishlist;
