import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Read sidebar state to dynamically adjust main padding if needed (optional if Sidebar handles its own fixed width)
  const isSidebarCollapsed = localStorage.getItem('hcm-sidebar-collapsed') === 'true';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      
      <div 
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}`}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        
        <main 
          style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: 'var(--color-bg)' }}
          className="custom-scrollbar"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
