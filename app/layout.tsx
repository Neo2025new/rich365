import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

import { Geist_Mono, Signika_Negative as V0_Font_Signika_Negative, Geist_Mono as V0_Font_Geist_Mono } from 'next/font/google'

// Initialize fonts
const _signikaNegative = V0_Font_Signika_Negative({ subsets: ['latin'], weight: ["300","400","500","600","700"] })
const _geistMono = V0_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })

export const metadata: Metadata = {
  title: "搞钱行动日历 - Action to Richness",
  description: "每天行动一小步，财富增长一大步。365个搞钱行动，帮你培养财富思维和行动习惯。",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
