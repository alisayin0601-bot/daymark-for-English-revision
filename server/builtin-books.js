const fs = require("node:fs");
const path = require("node:path");

const DIR = path.join(__dirname, "builtin-words");
const FILES = {
  "band-5-6": "band-5-6.js",
  "band-6-7": "band-6-7.js",
  "band-7-8": "band-7-8.js"
};

function loadOne(key) {
  const file = path.join(DIR, FILES[key]);
  if (!fs.existsSync(file)) return null;
  try {
    const book = require(file);
    if (!book || !Array.isArray(book.words) || !book.words.length) return null;
    return book;
  } catch (error) {
    console.warn(`[builtin-books] Could not load ${key}:`, error.message);
    return null;
  }
}

function builtinBooks() {
  return Object.keys(FILES)
    .map(loadOne)
    .filter(Boolean)
    .map((book) => ({
      key: book.key,
      level: book.level,
      name: book.name,
      nameZh: book.nameZh || book.name,
      wordCount: book.words.length
    }));
}

function builtinBook(key) {
  if (!FILES[key]) return null;
  return loadOne(key);
}

module.exports = { builtinBooks, builtinBook };
