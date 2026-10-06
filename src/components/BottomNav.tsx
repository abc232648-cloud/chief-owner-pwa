import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Bot, Inbox, Activity, MoreHorizontal } from 'lucide-react';
import { useChief } from '../context/ChiefContext';

export const BottomNav: React.FC = () => {
  const { totalPendingCount, stopInterlocksCount } = useChief();

  const navItems = [
    {
      to: '/',
      label: 'Home',
      icon: Home,
      exact: true
    },
    {
      to: '/agents',
      label: 'Agents',
      icon: Bot
    },
    {
      to: '/inbox',
      label: 'Inbox',
      icon: Inbox,
      badgeCount: totalPendingCount,
      hasStop: stopInterlocksCount > 0
    },
    {
      to: '/activity',
      label: 'Activity',
      icon: Activity
    },
    {
      to: '/more',
      label: 'More',
      icon: MoreHorizontal
    }
  ];

  return (
    <nav 
      aria-label="Primary mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#041a10]/95 backdrop-blur-lg border-t border-emerald-950/80 pb-safe select-none shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
    >
      <div className="max-w-md md:max-w-xl mx-auto px-2">
        <div className="grid grid-cols-5 items-center h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `
                  relative flex flex-col items-center justify-center min-h-[48px] w-full rounded-xl transition-all duration-150 active:scale-95
                  ${isActive 
                    ? 'text-emerald-400 font-semibold' 
                    : 'text-emerald-200/50 hover:text-emerald-200 font-medium'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'}`} />
                      
                      {/* Attention Badge for Inbox */}
                      {item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span className={`absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center text-white ring-2 ring-[#021209] ${
                          item.hasStop ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                        }`}>
                          {item.badgeCount}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] tracking-tight mt-1 truncate ${isActive ? 'text-emerald-300' : 'text-emerald-300/50'}`}>
                      {item.label}
                    </span>
                    {/* Active Tab Accent Bar */}
                    {isActive && (
                      <span className="absolute bottom-1 w-6 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
