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
  type: "streak" | "total"
}

export const BADGES: Badge[] = [
  {
    id: "newbie",
    name: "搞钱新星",
    emoji: "🏅",
    description: "连续打卡7天",
    requirement: 7,
    type: "streak",
  },
  {
    id: "veteran",
    name: "财富老兵",
    emoji: "💼",
    description: "连续打卡30天",
    requirement: 30,
    type: "streak",
  },
  {
    id: "tycoon",
    name: "行动富翁",
    emoji: "👑",
    description: "连续打卡100天",
    requirement: 100,
    type: "streak",
  },
  {
    id: "dedicated",
    name: "坚持者",
    emoji: "💪",
    description: "累计打卡50天",
    requirement: 50,
    type: "total",
  },
  {
    id: "master",
    name: "搞钱大师",
    emoji: "🎯",
    description: "累计打卡200天",
    requirement: 200,
    type: "total",
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
