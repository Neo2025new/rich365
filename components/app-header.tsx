"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, Trophy, User, LogOut, Settings } from "lucide-react"
import { mbtiData } from "@/lib/calendar-data"

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut, loading } = useAuth()

  // 不在这些页面显示导航
  const hideOnPages = ["/", "/login", "/onboarding"]
  if (hideOnPages.includes(pathname)) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        {/* Logo */}
        <Link href="/calendar" className="mr-6 flex items-center space-x-2">
          <span className="text-xl font-bold">📅 Rich365</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-4 md:space-x-6 text-sm font-medium flex-1">
          <Link
            href="/calendar"
            className={`flex items-center transition-colors hover:text-foreground/80 ${
              pathname.startsWith("/calendar") ||
              pathname.startsWith("/month") ||
              pathname.startsWith("/day")
                ? "text-foreground"
                : "text-foreground/60"
            }`}
          >
            <Calendar className="inline h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">日历</span>
          </Link>
          <Link
            href="/leaderboard"
            className={`flex items-center transition-colors hover:text-foreground/80 ${
              pathname === "/leaderboard" ? "text-foreground" : "text-foreground/60"
            }`}
          >
            <Trophy className="inline h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">排行榜</span>
          </Link>
        </nav>

        {/* User Menu */}
        {!loading && user && profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <span className="text-xl">{profile.avatar || "⭐"}</span>
                <span className="hidden md:inline font-medium">
                  {profile.username || "未命名用户"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{profile.avatar || "⭐"}</span>
                    <div>
                      <p className="text-sm font-medium leading-none">{profile.username || "未命名用户"}</p>
                      <p className="text-xs leading-none text-muted-foreground mt-1">
                        {profile.mbti && profile.role ? (
                          <>
                            {mbtiData[profile.mbti].emoji} {profile.mbti} · {profile.role}
                          </>
                        ) : (
                          "请完成设置"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/calendar")}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>我的日历</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/onboarding")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>重新设置</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Login Button for non-authenticated users */}
        {!loading && !user && (
          <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
            登录
          </Button>
        )}
      </div>
    </header>
  )
}
