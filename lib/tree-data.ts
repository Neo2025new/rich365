export interface TreeLevel {
  level: number
  name: string
  emoji: string
  requiredCheckIns: number
  description: string
  color: string
}

export const TREE_LEVELS: TreeLevel[] = [
  {
    level: 0,
    name: "种子",
    emoji: "🌱",
    requiredCheckIns: 0,
    description: "财富之旅的起点",
    color: "from-green-400 to-green-600",
  },
  {
    level: 1,
    name: "幼苗",
    emoji: "🌿",
    requiredCheckIns: 7,
    description: "开始生根发芽",
    color: "from-green-500 to-emerald-600",
  },
  {
    level: 2,
    name: "小树",
    emoji: "🌳",
    requiredCheckIns: 30,
    description: "茁壮成长中",
    color: "from-emerald-500 to-teal-600",
  },
  {
    level: 3,
    name: "大树",
    emoji: "🌲",
    requiredCheckIns: 100,
    description: "枝繁叶茂",
    color: "from-teal-500 to-cyan-600",
  },
  {
    level: 4,
    name: "参天大树",
    emoji: "🎄",
    requiredCheckIns: 200,
    description: "财富根基稳固",
    color: "from-cyan-500 to-blue-600",
  },
  {
    level: 5,
    name: "摇钱树",
    emoji: "💰",
    requiredCheckIns: 365,
    description: "财富自由之树",
    color: "from-yellow-500 to-amber-600",
  },
]

export function getTreeLevel(totalCheckIns: number): TreeLevel {
  for (let i = TREE_LEVELS.length - 1; i >= 0; i--) {
    if (totalCheckIns >= TREE_LEVELS[i].requiredCheckIns) {
      return TREE_LEVELS[i]
    }
  }
  return TREE_LEVELS[0]
}

export function getNextTreeLevel(totalCheckIns: number): TreeLevel | null {
  const currentLevel = getTreeLevel(totalCheckIns)
  const nextLevelIndex = currentLevel.level + 1

  if (nextLevelIndex >= TREE_LEVELS.length) {
    return null
  }

  return TREE_LEVELS[nextLevelIndex]
}

export function getTreeProgress(totalCheckIns: number): number {
  const currentLevel = getTreeLevel(totalCheckIns)
  const nextLevel = getNextTreeLevel(totalCheckIns)

  if (!nextLevel) {
    return 100
  }

  const currentLevelCheckIns = currentLevel.requiredCheckIns
  const nextLevelCheckIns = nextLevel.requiredCheckIns
  const progress = ((totalCheckIns - currentLevelCheckIns) / (nextLevelCheckIns - currentLevelCheckIns)) * 100

  return Math.min(Math.max(progress, 0), 100)
}
