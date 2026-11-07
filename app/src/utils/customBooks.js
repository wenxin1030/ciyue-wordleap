import { load, save } from './storage'
import { registerBook } from '../mock/books'
import { registerCustomWords } from '../mock/words'

const KEY = 'custom_books'
let loaded = false

export function listCustomBooks() {
  return load(KEY, []) || []
}

export function hydrateCustomBooks() {
  if (loaded) return
  loaded = true
  listCustomBooks().forEach(entry => {
    registerBook(entry.book)
    registerCustomWords(entry.book.id, entry.words)
  })
}

export function createCustomBook({ name, desc, type = '自定义', words: items }) {
  const id = 'custom_' + Date.now().toString(36)
  const book = {
    id,
    name,
    short: name.length > 8 ? name.slice(0, 8) : name,
    en: 'CUSTOM',
    type,
    letter: (name[0] || 'C').toUpperCase(),
    grad: 'grad8',
    total: items.length,
    desc: desc || '自建词书 · 仅保存在本地',
    tag: '自建',
    custom: true,
    createdAt: Date.now()
  }
  const list = listCustomBooks()
  list.push({ book, words: items })
  save(KEY, list)
  registerBook(book)
  registerCustomWords(id, items)
  return book
}

export function removeCustomBook(id) {
  const list = listCustomBooks().filter(x => x.book.id !== id)
  save(KEY, list)
}
