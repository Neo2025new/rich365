export interface CheckInRecord {
  date: string // YYYY-MM-DD format
  timestamp: number
  coins: number
}

export interface UserStats {
  totalCheckIns: number
  currentStreak: number
  longestStreak: number
  totalCoins: number
  checkInRecords: CheckInRecord[]
  badges: string[]
}

export interface Badge {
  id: string
  name: string
  emoji: string
  description: string
  requirement: number
  type: "streak" | "total" | "monthly" | "special"
  rarity?: "common" | "rare" | "epic" | "legendary"
}

export const BADGES: Badge[] = [
  // ===== 连续打卡徽章 (Streak Badges) =====
  {
    id: "newbie",
    name: "搞钱新星",
    emoji: "🌟",
    description: "连续打卡 7 天",
    requirement: 7,
    type: "streak",
    rarity: "common",
  },
  {
    id: "rising_star",
    name: "行动新秀",
    emoji: "⭐",
    description: "连续打卡 14 天",
    requirement: 14,
    type: "streak",
    rarity: "common",
  },
  {
    id: "veteran",
    name: "财富老兵",
    emoji: "💼",
    description: "连续打卡 30 天",
    requirement: 30,
    type: "streak",
    rarity: "rare",
  },
  {
    id: "warrior",
    name: "搞钱战士",
    emoji: "⚔️",
    description: "连续打卡 60 天",
    requirement: 60,
    type: "streak",
    rarity: "rare",
  },
  {
    id: "tycoon",
    name: "行动富翁",
    emoji: "👑",
    description: "连续打卡 100 天",
    requirement: 100,
    type: "streak",
    rarity: "epic",
  },
  {
    id: "legend",
    name: "财富传奇",
    emoji: "🔥",
    description: "连续打卡 200 天",
    requirement: 200,
    type: "streak",
    rarity: "epic",
  },
  {
    id: "immortal",
    name: "不朽之神",
    emoji: "💎",
    description: "连续打卡 365 天",
    requirement: 365,
    type: "streak",
    rarity: "legendary",
  },

  // ===== 累计打卡徽章 (Total Badges) =====
  {
    id: "beginner",
    name: "起步者",
    emoji: "🚶",
    description: "累计打卡 10 天",
    requirement: 10,
    type: "total",
    rarity: "common",
  },
  {
    id: "dedicated",
    name: "坚持者",
    emoji: "💪",
    description: "累计打卡 50 天",
    requirement: 50,
    type: "total",
    rarity: "common",
  },
  {
    id: "committed",
    name: "执着者",
    emoji: "🎖️",
    description: "累计打卡 100 天",
    requirement: 100,
    type: "total",
    rarity: "rare",
  },
  {
    id: "master",
    name: "搞钱大师",
    emoji: "🎯",
    description: "累计打卡 200 天",
    requirement: 200,
    type: "total",
    rarity: "epic",
  },
  {
    id: "grandmaster",
    name: "宗师",
    emoji: "👴",
    description: "累计打卡 365 天",
    requirement: 365,
    type: "total",
    rarity: "epic",
  },
  {
    id: "champion",
    name: "冠军",
    emoji: "🏆",
    description: "累计打卡 500 天",
    requirement: 500,
    type: "total",
    rarity: "legendary",
  },

  // ===== 月度挑战徽章 (Monthly Challenge Badges) =====
  {
    id: "january_warrior",
    name: "一月勇士",
    emoji: "🎊",
    description: "1 月完成 20 天打卡",
    requirement: 20,
    type: "monthly",
    rarity: "rare",
  },
  {
    id: "spring_champion",
    name: "春季冠军",
    emoji: "🌸",
    description: "春季（3-5月）完成 60 天打卡",
    requirement: 60,
    type: "monthly",
    rarity: "epic",
  },
  {
    id: "summer_hero",
    name: "夏季英雄",
    emoji: "☀️",
    description: "夏季（6-8月）完成 60 天打卡",
    requirement: 60,
    type: "monthly",
    rarity: "epic",
  },
  {
    id: "autumn_master",
    name: "秋季大师",
    emoji: "🍂",
    description: "秋季（9-11月）完成 60 天打卡",
    requirement: 60,
    type: "monthly",
    rarity: "epic",
  },
  {
    id: "winter_legend",
    name: "冬季传奇",
    emoji: "❄️",
    description: "冬季（12-2月）完成 60 天打卡",
    requirement: 60,
    type: "monthly",
    rarity: "epic",
  },

  // ===== 特殊成就徽章 (Special Achievement Badges) =====
  {
    id: "early_bird",
    name: "早起鸟",
    emoji: "🐦",
    description: "连续 7 天在早上 8 点前打卡",
    requirement: 7,
    type: "special",
    rarity: "rare",
  },
  {
    id: "night_owl",
    name: "夜猫子",
    emoji: "🦉",
    description: "连续 7 天在晚上 10 点后打卡",
    requirement: 7,
    type: "special",
    rarity: "rare",
  },
  {
    id: "comeback_king",
    name: "王者归来",
    emoji: "🦁",
    description: "中断后重新开始并达到 30 天连续",
    requirement: 30,
    type: "special",
    rarity: "epic",
  },
  {
    id: "perfectionist",
    name: "完美主义",
    emoji: "✨",
    description: "连续 30 天每天都完成打卡",
    requirement: 30,
    type: "special",
    rarity: "legendary",
  },
  {
    id: "wealth_pioneer",
    name: "财富先锋",
    emoji: "🚀",
    description: "首次完成打卡",
    requirement: 1,
    type: "special",
    rarity: "common",
  },
]

export function getUserStats(): UserStats {
  if (typeof window === "undefined") {
    return getDefaultStats()
  }

  try {
    const stored = localStorage.getItem("userStats")
    if (!stored) {
      return getDefaultStats()
    }

    return JSON.parse(stored)
  } catch (error) {
    console.error("Failed to load user stats from localStorage:", error)
    return getDefaultStats()
  }
}

export function saveUserStats(stats: UserStats): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("userStats", JSON.stringify(stats))
  } catch (error) {
    console.error("Failed to save user stats to localStorage:", error)
  }
}

function getDefaultStats(): UserStats {
  return {
    totalCheckIns: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalCoins: 0,
    checkInRecords: [],
    badges: [],
  }
}

export function hasCheckedInToday(date: string): boolean {
  const stats = getUserStats()
  return stats.checkInRecords.some((record) => record.date === date)
}

export function checkIn(date: string): { stats: UserStats; newBadges: Badge[] } {
  const stats = getUserStats()

  // Validate date: only allow check-in for today or past dates, not future dates
  const checkInDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  checkInDate.setHours(0, 0, 0, 0)

  if (checkInDate > today) {
    console.warn("Cannot check in for future dates")
    return { stats, newBadges: [] }
  }

  // Prevent duplicate check-ins
  if (hasCheckedInToday(date)) {
    return { stats, newBadges: [] }
  }

  // Add new check-in record
  const coins = 10 // Base coins per check-in
  const newRecord: CheckInRecord = {
    date,
    timestamp: Date.now(),
    coins,
  }

  stats.checkInRecords.push(newRecord)
  stats.totalCheckIns += 1
  stats.totalCoins += coins

  // Calculate streak
  const sortedRecords = [...stats.checkInRecords].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  let currentStreak = 1
  const streakDate = new Date(date)

  for (let i = 1; i < sortedRecords.length; i++) {
    const currentDate = new Date(sortedRecords[i - 1].date)
    const prevDate = new Date(sortedRecords[i].date)
    const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      currentStreak++
    } else {
      break
    }
  }

  stats.currentStreak = currentStreak
  stats.longestStreak = Math.max(stats.longestStreak, currentStreak)

  // Check for new badges
  const newBadges: Badge[] = []

  for (const badge of BADGES) {
    if (stats.badges.includes(badge.id)) continue

    const requirement = badge.requirement
    const achieved = badge.type === "streak" ? stats.currentStreak >= requirement : stats.totalCheckIns >= requirement

    if (achieved) {
      stats.badges.push(badge.id)
      newBadges.push(badge)
    }
  }

  saveUserStats(stats)

  return { stats, newBadges }
}

export function getEarnedBadges(): Badge[] {
  const stats = getUserStats()
  return BADGES.filter((badge) => stats.badges.includes(badge.id))
}

export function getNextBadge(): Badge | null {
  const stats = getUserStats()
  const unearned = BADGES.filter((badge) => !stats.badges.includes(badge.id))

  if (unearned.length === 0) return null

  // Separate badges by type and find the closest one for each
  const streakBadges = unearned.filter((b) => b.type === "streak")
  const totalBadges = unearned.filter((b) => b.type === "total")

  let nextStreakBadge: Badge | null = null
  let nextTotalBadge: Badge | null = null

  if (streakBadges.length > 0) {
    nextStreakBadge = streakBadges.reduce((closest, badge) => {
      const badgeDiff = badge.requirement - stats.currentStreak
      const closestDiff = closest.requirement - stats.currentStreak
      return badgeDiff >= 0 && badgeDiff < closestDiff ? badge : closest
    })
  }

  if (totalBadges.length > 0) {
    nextTotalBadge = totalBadges.reduce((closest, badge) => {
      const badgeDiff = badge.requirement - stats.totalCheckIns
      const closestDiff = closest.requirement - stats.totalCheckIns
      return badgeDiff >= 0 && badgeDiff < closestDiff ? badge : closest
    })
  }

  // Return whichever is closer to being achieved
  if (!nextStreakBadge) return nextTotalBadge
  if (!nextTotalBadge) return nextStreakBadge

  const streakProgress = stats.currentStreak / nextStreakBadge.requirement
  const totalProgress = stats.totalCheckIns / nextTotalBadge.requirement

  return streakProgress > totalProgress ? nextStreakBadge : nextTotalBadge
}
