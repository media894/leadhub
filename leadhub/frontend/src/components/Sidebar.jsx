import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import IndiamartGuideModal from './IndiamartGuideModal';

export default function Sidebar({ totalLeadsCount = 0 }) {
  const { user, logout } = useAuth();
  const [showGuideModal, setShowGuideModal] = useState(false);

  const nav = [
    { to: '/dashboard', label: 'Lead Dashboard', icon: '⚡', badge: totalLeadsCount },
    { to: '/inbox', label: 'Email Inbox', icon: '✉️' },
    { to: '/bulk-mail', label: 'Bulk Campaign', icon: '📨' },
    { to: '/whatsapp-link', label: 'WhatsApp Status', icon: '💬' },
    { to: '/settings', label: 'Settings & APIs', icon: '⚙️' },
  ];

  return (
    <>
      <IndiamartGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
      <aside className="w-64 shrink-0 glass-panel text-slate-200 flex flex-col h-screen sticky top-0 border-r border-slate-800/80 font-sans shadow-2xl z-30">
        {/* Logo & Brand Header */}
        <div className="px-5 py-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/20 border border-amber-400/30 animate-pulse-glow">
              🚀
            </div>
            <div>
              <div className="font-extrabold text-base text-slate-100 tracking-tight leading-none gradient-text">
                LeadHub
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-semibold tracking-wide">
                IndiaMART AI Suite
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto scrollbar-thin">
          {nav.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <span className="tracking-wide">{item.label}</span>
              </div>
              {item.badge != null && item.badge > 0 && (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/40">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Integration Guide Button */}
        <div className="px-3 py-2">
          <button
            onClick={() => setShowGuideModal(true)}
            className="w-full py-2 px-3 bg-slate-900/80 hover:bg-slate-800 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
          >
            <span>📖 Setup Guide</span>
          </button>
        </div>

        {/* User Account & Logout */}
        <div className="px-4 py-3.5 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-500/40">
              {user?.name?.[0]?.toUpperCase() || 'L'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-100 truncate">{user?.name || 'User'}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.companyName || 'LeadHub Workspace'}</div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="text-xs text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10"
          >
            🚪
          </button>
        </div>
      </aside>
    </>
  );
}
