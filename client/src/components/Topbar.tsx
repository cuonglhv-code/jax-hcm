import React from 'react'
import { Search, Bell, Sun, Moon } from 'lucide-react'
import { Avatar } from './Avatar'
import { LanguageToggle } from './LanguageToggle'
import { useAuth } from '../contexts/AuthContext'

interface TopbarProps {
  title?: string
}

export function Topbar({ title }: TopbarProps) {
  const { user } = useAuth()
  const [dark, setDark] = React.useState(() => document.documentElement.classList.contains('dark'))

  const toggleDark = () => {
    const isDark = !dark
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('hcm_theme', isDark ? 'dark' : 'light')
  }

  return (
    <header className="flex items-center gap-4 h-16 px-6 bg-white dark:bg-surface-dark-card border-b border-gray-100 dark:border-surface-dark-border shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search employees, docs..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 transition"
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <LanguageToggle />

        <button
          onClick={toggleDark}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Toggle theme"
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full" />
        </button>

        {user && (
          <div className="flex items-center gap-2 pl-2">
            <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
            <div className="hidden md:block">
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
