import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const marginLeft = isDesktop ? (collapsed ? 68 : 236) : 0;

  return (
    <div className="flex min-h-screen bg-animated" style={{ overflowX: 'hidden', maxWidth: '100vw' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />

      <main
        className="flex-1 min-h-screen transition-all duration-300"
        style={{ marginLeft, overflowX: 'hidden', maxWidth: isDesktop ? `calc(100vw - ${marginLeft}px)` : '100vw' }}
      >
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-white/5"
          style={{ background: 'rgba(2,8,23,0.95)', backdropFilter: 'blur(16px)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            ☰
          </button>
          <span className="text-base font-black text-white" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            Health<span className="gradient-text-blue">Track360</span>
          </span>
          <div className="w-9" />
        </div>

        <div className="w-full px-3 sm:px-6 py-4 sm:py-8" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
