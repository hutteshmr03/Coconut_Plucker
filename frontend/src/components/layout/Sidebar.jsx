import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getDisplayName } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import {
  Home,
  CalendarPlus,
  BookOpen,
  User,
  LayoutDashboard,
  ClipboardList,
  ShieldCheck,
  Users,
  Briefcase,
  AlertTriangle,
  FileBarChart,
  LogOut,
  ShieldAlert,
  Sliders,
  FileCheck,
  KeyRound,
  X
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const Sidebar = () => {
  const { currentUser, logout, role, adminAccounts } = useAuth();
  const { bookings, professionals, incidents, currentView, setCurrentView, isMobileSidebarOpen, setIsMobileSidebarOpen } = useApp();
  const { t, language } = useLanguage();

  // Customer navigation items (CustomerRateCard and CustomerHome removed per instruction)
  const safeBookings = bookings || [];
  const safeProfessionals = professionals || [];
  const safeIncidents = incidents || [];
  const safeAdminAccounts = adminAccounts || [];

  const customerNav = [
    {
      group: 'Bookings',
      items: [
        { id: 'cust-book', label: t('nav_book_service'), icon: CalendarPlus },
        {
          id: 'cust-bookings',
          label: t('nav_my_bookings'),
          icon: BookOpen,
          count: safeBookings.filter(
            (b) =>
              b &&
              b.customer_id === currentUser?.id &&
              b.status !== 'completed' &&
              b.status !== 'cancelled'
          ).length
        }
      ]
    },
    {
      group: 'My Account',
      items: [
        { id: 'cust-profile', label: t('nav_profile'), icon: User }
      ]
    }
  ];

  // Professional navigation items (No Marketplace, No Earnings per specification)
  const professionalNav = [
    {
      group: 'Workforce',
      items: [
        { id: 'work-dash', label: t('nav_dashboard'), icon: LayoutDashboard },
        {
          id: 'work-jobs',
          label: t('nav_assigned_jobs'),
          icon: ClipboardList,
          count: safeBookings.filter(
            (b) =>
              b &&
              b.professional_id === currentUser?.id &&
              (b.status === 'assigned' || b.status === 'in_progress')
          ).length
        }
      ]
    },
    {
      group: 'My Account',
      items: [
        { id: 'work-profile', label: t('nav_profile'), icon: User }
      ]
    }
  ];

  // Admin navigation items
  const adminNav = [
    {
      group: 'Overview',
      items: [
        { id: 'adm-overview', label: t('nav_dashboard'), icon: LayoutDashboard },
        { id: 'sadm-scheduling', label: t('nav_scheduling'), icon: Sliders },
        { id: 'adm-reports', label: t('nav_analytics'), icon: FileBarChart }
      ]
    },
    {
      group: 'Operations',
      items: [
        {
          id: 'adm-bookings',
          label: t('nav_all_bookings'),
          icon: BookOpen,
          count: safeBookings.filter((b) => b && b.status === 'requested').length
        },
        {
          id: 'adm-workforce',
          label: t('nav_workforce'),
          icon: Users,
          count: safeProfessionals.filter((p) => p && p.status === 'pending_verification').length
        },
        { id: 'adm-services', label: t('nav_catalog'), icon: Briefcase },
        {
          id: 'adm-safety',
          label: t('nav_safety_incidents'),
          icon: AlertTriangle,
          count: safeIncidents.filter((i) => i && i.status === 'open').length
        }
      ]
    },
    {
      group: 'My Account',
      items: [
        { id: 'adm-profile', label: t('nav_profile'), icon: User }
      ]
    }
  ];

  // Super Admin navigation items (Governance + Full Admin Superset)
  const superAdminNav = [
    {
      group: 'Super Admin Governance',
      items: [
        {
          id: 'sadm-admins',
          label: t('nav_admin_management'),
          icon: ShieldAlert,
          count: safeAdminAccounts.length
        },
        { id: 'sadm-scheduling', label: t('nav_scheduling'), icon: Sliders },
        { id: 'sadm-audit', label: t('nav_audit_trail'), icon: FileCheck }
      ]
    },
    {
      group: 'Platform Operations',
      items: [
        { id: 'adm-overview', label: t('nav_dashboard'), icon: LayoutDashboard },
        {
          id: 'adm-bookings',
          label: t('nav_all_bookings'),
          icon: BookOpen,
          count: safeBookings.filter((b) => b && b.status === 'requested').length
        },
        {
          id: 'adm-workforce',
          label: t('nav_workforce'),
          icon: Users,
          count: safeProfessionals.filter((p) => p && p.status === 'pending_verification').length
        },
        { id: 'adm-services', label: t('nav_catalog'), icon: Briefcase },
        {
          id: 'adm-safety',
          label: t('nav_safety_incidents'),
          icon: AlertTriangle,
          count: safeIncidents.filter((i) => i && i.status === 'open').length
        },
        { id: 'adm-reports', label: t('nav_analytics'), icon: FileBarChart }
      ]
    },
    {
      group: 'My Account',
      items: [
        { id: 'sadm-profile', label: t('nav_profile'), icon: User }
      ]
    }
  ];

  const activeNav =
    role === 'super_admin'
      ? superAdminNav
      : role === 'customer'
      ? customerNav
      : role === 'professional'
      ? professionalNav
      : adminNav;

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      <div
        className={`sidebar-backdrop ${isMobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={logoImg}
              alt="Coconut Plucker Logo"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                objectFit: 'cover',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            />
            <div className="brand-text">
              <div className="t1">Coconut Plucker</div>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            className="sidebar-close-btn"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close navigation"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Info Badge (Hidden for Professional role per instruction) */}
        {role !== 'professional' && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name || 'User'}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--gold)',
                  flexShrink: 0
                }}
              />
            ) : (
              <div
                className="worker-avatar"
                style={{ width: '36px', height: '36px', fontSize: '13px', flexShrink: 0 }}
              >
                {(currentUser?.full_name || currentUser?.name || currentUser?.username || 'SF')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {getDisplayName(currentUser, language)}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#8CAABB'
                }}
              >
                {t(`role_${currentUser?.role}`, currentUser?.role || '')}
                {currentUser?.taluka ? ` · ${t(`taluka_${currentUser.taluka.toLowerCase().replace(/\s+/g, '_')}`, currentUser.taluka)}` : ''}
              </div>
            </div>
          </div>
        )}

        {/* Role-Specific Navigation */}
        <nav style={{ flex: 1 }}>
          {activeNav.map((group, gIdx) => (
            <div key={gIdx} className="nav-group">
              <div className="nav-label">{group.group}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <div
                    key={item.id}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView(item.id);
                      setIsMobileSidebarOpen(false);
                    }}
                  >
                    <span className="nav-ic">
                      <Icon size={16} />
                    </span>
                    <span>{item.label}</span>
                    {item.count > 0 && <span className="nav-count">{item.count}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer & Sign Out */}
        <div className="sidebar-foot">
          <button
            className="nav-item"
            style={{ width: '100%', color: '#E4A15E' }}
            onClick={() => {
              logout();
              setIsMobileSidebarOpen(false);
            }}
          >
            <LogOut size={16} />
            <span>{t('sign_out')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
