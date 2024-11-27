import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Status Network Testing Suite',
  description: 'Performance monitoring and comparison tool for Status Network',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="h-full">
      <body className={cn(
        inter.className,
        "min-h-screen bg-gray-50 antialiased"
      )}>
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 flex">
                <a className="flex items-center space-x-2" href="/">
                  <span className="font-bold inline-block">
                    Status Network Testing Suite
                  </span>
                </a>
              </div>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                {/* <a
                  href="/dashboard"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Dashboard
                </a> */}
                <a
                  href="/stress-test"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Stress Test
                </a>
                <a
                  href="/reports"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Reports
                </a>
              </nav>
            </div>
          </header>
          
          <main className="flex-1">
            <div className="container mx-auto py-6">
              {children}
            </div>
          </main>

          <footer className="border-t">
            <div className="container mx-auto px-4 py-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  © {new Date().getFullYear()} Status Network Testing Suite
                </div>
                <div className="flex items-center space-x-4">
                  <a
                    href="https://docs.status.network"
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Documentation
                  </a>
                  <a
                    href="https://hub.status.network"
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Hub
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}