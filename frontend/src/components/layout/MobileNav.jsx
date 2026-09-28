import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { Home, CalendarPlus, BookOpen, User, LayoutDashboard, ClipboardList, Briefcase } from 'lucide-react';

export const MobileNav = () => {
  const { role } = useAuth();
  const { currentView, setCurrentView } = useApp();
  const { t } = useLanguage();

  const getItems = () => {
    if (role === 'customer') {
      return [
        { id: 'cust-book', label: t('nav_book_service'), icon: CalendarPlus },
        { id: 'cust-bookings', label: t('nav_my_bookings'), icon: BookOpen },
        { id: 'cust-profile', label: t('nav_profile'), icon: User }
      ];
    }
    if (role === 'professional') {
      return [
        { id: 'work-dash', label: t('nav_dashboard'), icon: LayoutDashboard },
        { id: 'work-jobs', label: t('nav_assigned_jobs'), icon: ClipboardList },
        { id: 'work-profile', label: t('nav_profile'), icon: User }
      ];
    }
    return [
      { id: 'adm-overview', label: t('nav_dashboard'), icon: LayoutDashboard },
      { id: 'adm-bookings', label: t('nav_all_bookings'), icon: BookOpen },
      { id: 'adm-services', label: t('nav_catalog'), icon: Briefcase }
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
