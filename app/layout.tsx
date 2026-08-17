import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";
export const metadata:Metadata={title:"RoboEngineer AI — 机械臂工程设计工具",description:"从力矩计算、电机选型到 BOM 生成的免费机械臂工程工具",other:{"codex-preview":"development"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}<Analytics /></body></html>}
