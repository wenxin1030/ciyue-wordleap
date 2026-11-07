export const books = [
  { id: 'cet4', name: '大学英语四级核心词汇', short: '四级核心词汇', en: 'CET-4', type: '四级', letter: 'C', grad: 'grad1', total: 2300, desc: '覆盖四级真题高频词，按考频排序，适合 12 月冲刺。', tag: '主修' },
  { id: 'cet6', name: '大学英语六级进阶词汇', short: '六级进阶词汇', en: 'CET-6', type: '六级', letter: 'S', grad: 'grad2', total: 2100, desc: '在四级基础上扩展学术与新闻语境词汇。', tag: '' },
  { id: 'ielts', name: 'IELTS 学术词汇', short: '雅思学术词汇', en: 'IELTS', type: '雅思', letter: 'I', grad: 'grad3', total: 1850, desc: '雅思阅读与写作高频学术词，含同义替换。', tag: '' },
  { id: 'kaoyan', name: '考研高频词', short: '考研高频词', en: 'POSTGRAD', type: '考研', letter: 'K', grad: 'grad4', total: 1200, desc: '近十年考研英语真题高频词与熟词僻义。', tag: '' },
  { id: 'toefl', name: 'TOEFL 学科词汇', short: '托福学科词汇', en: 'TOEFL', type: '托福', letter: 'T', grad: 'grad5', total: 2000, desc: '按生物、地质、天文等学科主题分组。', tag: '' },
  { id: 'gre', name: 'GRE 高频 3000', short: 'GRE 高频 3000', en: 'GRE', type: 'GRE', letter: 'G', grad: 'grad6', total: 3000, desc: '填空与阅读中的高阶抽象词，配词根拆解。', tag: '' },
  { id: 'bec', name: '商务英语 BEC', short: '商务英语 BEC', en: 'BEC', type: '商务', letter: 'B', grad: 'grad7', total: 1500, desc: '会议、邮件、谈判场景的商务表达。', tag: '' },
  { id: 'academic', name: '学术写作常用词', short: '学术写作词汇', en: 'ACADEMIC', type: '学术', letter: 'A', grad: 'grad8', total: 900, desc: '论文写作中的逻辑连接与论证动词。', tag: '' }
]

export const bookFilters = ['全部', '四级', '六级', '雅思', '考研', '托福', 'GRE', '商务', '学术', '自定义']

export function registerBook(book) {
  if (!books.some(b => b.id === book.id)) books.push(book)
  return book
}

export const bookById = id => books.find(b => b.id === id)

export const gradMap = {
  grad1: 'linear-gradient(135deg,#2E8B73,#1F6F5C)',
  grad2: 'linear-gradient(135deg,#C97A4F,#B25B37)',
  grad3: 'linear-gradient(135deg,#4C63B6,#3B4E93)',
  grad4: 'linear-gradient(135deg,#3E8E8A,#2C6E6A)',
  grad5: 'linear-gradient(135deg,#2C7F86,#1E5F66)',
  grad6: 'linear-gradient(135deg,#7B5EA7,#5E4385)',
  grad7: 'linear-gradient(135deg,#B08A3E,#8E6B25)',
  grad8: 'linear-gradient(135deg,#6B7A8F,#4E5A6B)'
}
