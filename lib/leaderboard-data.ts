import { getUserStats } from "./checkin-data"

export interface LeaderboardEntry {
  id: string
  username: string
  avatar: string
  currentStreak: number
  totalCheckIns: number
  totalCoins: number
  isCurrentUser?: boolean
}

// Mock leaderboard data for demonstration
export function getLeaderboardData(): LeaderboardEntry[] {
  const userStats = getUserStats()

  // Generate mock users with realistic data
  const mockUsers: LeaderboardEntry[] = [
    {
      id: "user1",
      username: "搞钱达人",
      avatar: "💼",
      currentStreak: 156,
      totalCheckIns: 289,
      totalCoins: 2890,
    },
    {
      id: "user2",
      username: "财富自由者",
      avatar: "👑",
      currentStreak: 142,
      totalCheckIns: 267,
      totalCoins: 2670,
    },
    {
      id: "user3",
      username: "行动派",
      avatar: "🚀",
      currentStreak: 98,
      totalCheckIns: 234,
      totalCoins: 2340,
    },
    {
      id: "user4",
      username: "创业小能手",
      avatar: "💡",
      currentStreak: 87,
      totalCheckIns: 198,
      totalCoins: 1980,
    },
    {
      id: "user5",
      username: "搞钱学姐",
      avatar: "📚",
      currentStreak: 76,
      totalCheckIns: 176,
      totalCoins: 1760,
    },
    {
      id: "user6",
      username: "财富建造师",
      avatar: "🏗️",
      currentStreak: 65,
      totalCheckIns: 154,
      totalCoins: 1540,
    },
    {
      id: "user7",
      username: "金币收集者",
      avatar: "🪙",
      currentStreak: 54,
      totalCheckIns: 132,
      totalCoins: 1320,
    },
    {
      id: "user8",
      username: "行动富翁",
      avatar: "💰",
      currentStreak: 43,
      totalCheckIns: 110,
      totalCoins: 1100,
    },
  ]

  // Add current user to the list
  const currentUser: LeaderboardEntry = {
    id: "current",
    username: "我",
    avatar: "⭐",
    currentStreak: userStats.currentStreak,
    totalCheckIns: userStats.totalCheckIns,
    totalCoins: userStats.totalCoins,
    isCurrentUser: true,
  }

  // Combine and sort by the selected metric
  const allUsers = [...mockUsers, currentUser]

  return allUsers
}

export function getStreakLeaderboard(): LeaderboardEntry[] {
  return getLeaderboardData()
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 10)
}

export function getTotalCheckInsLeaderboard(): LeaderboardEntry[] {
  return getLeaderboardData()
    .sort((a, b) => b.totalCheckIns - a.totalCheckIns)
    .slice(0, 10)
}

export function getUserRank(type: "streak" | "total"): number {
  const leaderboard = type === "streak" ? getStreakLeaderboard() : getTotalCheckInsLeaderboard()

  const userIndex = leaderboard.findIndex((entry) => entry.isCurrentUser)
  return userIndex === -1 ? leaderboard.length + 1 : userIndex + 1
}
