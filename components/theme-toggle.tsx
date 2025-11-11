"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Moon, Sun, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card
        className={cn(
          "cursor-pointer border-2 p-4 hover:bg-muted/50 transition-colors",
          theme === "light" && "border-primary bg-muted/50"
        )}
        onClick={() => setTheme("light")}
      >
        <div className="flex flex-col items-center gap-3">
          <Sun className="h-6 w-6" />
          <span className="text-sm font-medium">Light</span>
        </div>
      </Card>
      
      <Card
        className={cn(
          "cursor-pointer border-2 p-4 hover:bg-muted/50 transition-colors",
          theme === "dark" && "border-primary bg-muted/50"
        )}
        onClick={() => setTheme("dark")}
      >
        <div className="flex flex-col items-center gap-3">
          <Moon className="h-6 w-6" />
          <span className="text-sm font-medium">Dark</span>
        </div>
      </Card>
      
      <Card
        className={cn(
          "cursor-pointer border-2 p-4 hover:bg-muted/50 transition-colors",
          theme === "system" && "border-primary bg-muted/50"
        )}
        onClick={() => setTheme("system")}
      >
        <div className="flex flex-col items-center gap-3">
          <Monitor className="h-6 w-6" />
          <span className="text-sm font-medium">System</span>
        </div>
      </Card>
    </div>
  )
}