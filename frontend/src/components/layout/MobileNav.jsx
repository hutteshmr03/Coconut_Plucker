import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Home, CalendarPlus, BookOpen, User, LayoutDashboard, ClipboardList, Briefcase } from 'lucide-react';

export const MobileNav = () => {
  const { role } = useAuth();
  const { currentView, setCurrentView } = useApp();

  const getItems = () => {
    if (role === 'customer') {
      return [
        { id: 'cust-book', label: 'Book', icon: CalendarPlus },
        { id: 'cust-bookings', label: 'Bookings', icon: BookOpen },
        { id: 'cust-profile', label: 'Profile', icon: User }
      ];
    }
    if (role === 'professional') {
      return [
        { id: 'work-dash', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'work-jobs', label: 'Assigned', icon: ClipboardList },
        { id: 'work-profile', label: 'Profile', icon: User }
      ];
    }
    return [
      { id: 'adm-overview', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'adm-bookings', label: 'Bookings', icon: BookOpen },
      { id: 'adm-services', label: 'Services', icon: Briefcase }
    ];
  };

  const items = getItems();

  return (
    <nav className="mobile-nav">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <div
            key={item.id}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
};
