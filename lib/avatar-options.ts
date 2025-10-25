/**
 * 用户头像选项
 * 提供一组精选的 emoji 头像供用户选择
 */

export interface AvatarOption {
  emoji: string
  name: string
  category: "people" | "animals" | "objects" | "symbols"
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  // 人物类
  { emoji: "😊", name: "微笑", category: "people" },
  { emoji: "😎", name: "酷炫", category: "people" },
  { emoji: "🤓", name: "学霸", category: "people" },
  { emoji: "🥳", name: "庆祝", category: "people" },
  { emoji: "🤩", name: "星星眼", category: "people" },
  { emoji: "😇", name: "天使", category: "people" },
  { emoji: "🤑", name: "发财", category: "people" },
  { emoji: "🧐", name: "思考", category: "people" },

  // 动物类
  { emoji: "🦁", name: "狮子", category: "animals" },
  { emoji: "🐯", name: "老虎", category: "animals" },
  { emoji: "🦄", name: "独角兽", category: "animals" },
  { emoji: "🐉", name: "龙", category: "animals" },
  { emoji: "🦅", name: "雄鹰", category: "animals" },
  { emoji: "🐺", name: "狼", category: "animals" },
  { emoji: "🦊", name: "狐狸", category: "animals" },
  { emoji: "🐼", name: "熊猫", category: "animals" },

  // 物品类
  { emoji: "💼", name: "公文包", category: "objects" },
  { emoji: "👑", name: "皇冠", category: "objects" },
  { emoji: "🎯", name: "靶心", category: "objects" },
  { emoji: "🚀", name: "火箭", category: "objects" },
  { emoji: "💡", name: "灯泡", category: "objects" },
  { emoji: "🔥", name: "火焰", category: "objects" },
  { emoji: "⚡", name: "闪电", category: "objects" },
  { emoji: "💎", name: "钻石", category: "objects" },

  // 符号类
  { emoji: "⭐", name: "星星", category: "symbols" },
  { emoji: "🌟", name: "闪星", category: "symbols" },
  { emoji: "✨", name: "亮星", category: "symbols" },
  { emoji: "💫", name: "流星", category: "symbols" },
  { emoji: "🎨", name: "调色板", category: "symbols" },
  { emoji: "🎭", name: "面具", category: "symbols" },
  { emoji: "🎪", name: "马戏团", category: "symbols" },
  { emoji: "🎬", name: "电影", category: "symbols" },
]

/**
 * 获取随机头像
 */
export function getRandomAvatar(): string {
  const randomIndex = Math.floor(Math.random() * AVATAR_OPTIONS.length)
  return AVATAR_OPTIONS[randomIndex].emoji
}

/**
 * 按分类获取头像
 */
export function getAvatarsByCategory(category: AvatarOption["category"]): AvatarOption[] {
  return AVATAR_OPTIONS.filter((avatar) => avatar.category === category)
}

/**
 * 生成随机用户名建议
 */
export function generateRandomUsername(): string {
  const adjectives = [
    "搞钱",
    "财富",
    "行动",
    "创业",
    "自由",
    "成功",
    "奋斗",
    "进取",
    "智慧",
    "勇敢",
  ]

  const nouns = ["达人", "专家", "高手", "大师", "精英", "先锋", "战士", "英雄", "冠军", "领袖"]

  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
  const randomNum = Math.floor(Math.random() * 9999)

  return `${randomAdj}${randomNoun}${randomNum}`
}
