import React, { useState } from 'react';
import { Menu, Search, Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 shrink-0 bg-surface border-b border-border flex items-center justify-between px-4 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-text-muted hover:bg-surface-offset rounded-md transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative hidden md:flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-text-muted" />
          <input
            type="text"
            placeholder="Search employees, courses, requisitions…"
            className="pl-9 pr-4 py-2 w-72 bg-surface-2 border border-border rounded-md text-sm text-text-base placeholder:text-text-faint focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button onClick={toggleTheme} className="p-2 text-text-muted hover:bg-surface-offset rounded-full transition-colors">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <button className="relative p-2 text-text-muted hover:bg-surface-offset rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold hover:ring-2 hover:ring-primary/50 transition-all focus:outline-none ml-2"
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </button>
          
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-md border border-border overflow-hidden z-50">
                <Link to="/employees/me" className="block w-full text-left px-4 py-2 text-sm text-text-base hover:bg-surface-offset" onClick={() => setDropdownOpen(false)}>My Profile</Link>
                <button className="block w-full text-left px-4 py-2 text-sm text-text-base hover:bg-surface-offset" onClick={() => setDropdownOpen(false)}>Change Password</button>
                <div className="h-px bg-divider my-1"></div>
                <button 
                  className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-offset" 
                  onClick={() => { setDropdownOpen(false); logout(); }}
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
