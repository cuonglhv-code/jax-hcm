import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabType {
  id: string;
  label: string;
  icon?: LucideIcon;
}

export interface TabsProps {
  tabs: TabType[];
  activeTab: string;
  onChange: (id: string) => void;
  children: ReactNode;
}

export function Tabs({ tabs, activeTab, onChange, children }: TabsProps) {
  return (
    <div className="w-full">
      <div className="flex overflow-x-auto border-b border-divider hide-scrollbar" role="tablist">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  const nextTab = tabs[idx + 1] || tabs[0];
                  onChange(nextTab.id);
                  document.getElementById(`tab-${nextTab.id}`)?.focus();
                } else if (e.key === 'ArrowLeft') {
                  const prevTab = tabs[idx - 1] || tabs[tabs.length - 1];
                  onChange(prevTab.id);
                  document.getElementById(`tab-${prevTab.id}`)?.focus();
                }
              }}
              className={`
                flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus:bg-surface-offset
                ${isActive ? 'text-primary border-b-2 border-primary -mb-px hover:border-primary-hover hover:text-primary-hover' 
                  : 'text-text-muted hover:text-text-base hover:border-text-base border-b-2 border-transparent'}
              `}
            >
              {tab.icon && <tab.icon className="w-4 h-4 shrink-0" />}
              {tab.label}
            </button>
          );
        })}
      </div>
      <div 
        id={`panel-${activeTab}`} 
        role="tabpanel" 
        aria-labelledby={`tab-${activeTab}`}
        className="pt-6 focus:outline-none"
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  );
}
