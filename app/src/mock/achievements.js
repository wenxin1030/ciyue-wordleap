export const achievements = [
  { id: 'streak7', name: '连续 7 天', icon: 'flame', category: '坚持', desc: '连续学习 7 天', target: 7, metric: 'streak' },
  { id: 'streak14', name: '连续 14 天', icon: 'flame', category: '坚持', desc: '连续学习 14 天', target: 14, metric: 'streak' },
  { id: 'streak30', name: '连续 30 天', icon: 'flame', category: '坚持', desc: '连续学习 30 天', target: 30, metric: 'streak' },
  { id: 'words100', name: '百词斩', icon: 'book', category: '学习', desc: '累计掌握 100 个单词', target: 100, metric: 'mastered' },
  { id: 'words1000', name: '千词斩', icon: 'book', category: '学习', desc: '累计掌握 1000 个单词', target: 1000, metric: 'mastered' },
  { id: 'perfect', name: '满分小测', icon: 'star', category: '挑战', desc: '单轮学习正确率 100%', target: 1, metric: 'perfectSessions' },
  { id: 'early', name: '早起鸟', icon: 'sun', category: '坚持', desc: '在 7 点前开始学习', target: 1, metric: 'earlyBirds' },
  { id: 'night', name: '夜猫子', icon: 'moon', category: '坚持', desc: '在 23 点后仍在学习', target: 1, metric: 'nightOwls' },
  { id: 'month', name: '月满贯', icon: 'calendar', category: '坚持', desc: '一个月内学习 26 天', target: 26, metric: 'monthDays' },
  { id: 'king', name: '词王', icon: 'crown', category: '学习', desc: '掌握的单词覆盖 3 本词书', target: 3, metric: 'booksTouched' },
  { id: 'arena', name: '擂台新星', icon: 'trophy', category: '挑战', desc: '听写擂台单局得分 30 以上', target: 30, metric: 'arenaBest' },
  { id: 'gardener', name: '森林园丁', icon: 'tree', category: '挑战', desc: '词汇森林里种下 20 棵树', target: 20, metric: 'trees' }
]

export const levelTable = [
  { lv: 1, exp: 0, title: '初学乍练' },
  { lv: 2, exp: 120, title: '入门学习者' },
  { lv: 3, exp: 300, title: '稳步前进' },
  { lv: 4, exp: 560, title: '渐入佳境' },
  { lv: 5, exp: 900, title: '勤学不辍' },
  { lv: 6, exp: 1320, title: '词汇猎手' },
  { lv: 7, exp: 1850, title: '进阶学习者' },
  { lv: 8, exp: 2500, title: '词汇达人' },
  { lv: 9, exp: 3300, title: '记忆大师' },
  { lv: 10, exp: 4300, title: '词王' }
]
