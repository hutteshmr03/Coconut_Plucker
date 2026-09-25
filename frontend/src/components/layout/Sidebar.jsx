import React from 'react';
import { useAuth } from '../../context/AuthContext';
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
  KeyRound
} from 'lucide-react';

export const Sidebar = () => {
  const { currentUser, logout, role, adminAccounts } = useAuth();
  const { bookings, professionals, incidents, currentView, setCurrentView } = useApp();

  // Customer navigation items (CustomerRateCard and CustomerHome removed per instruction)
  const safeBookings = bookings || [];
  const safeProfessionals = professionals || [];
  const safeIncidents = incidents || [];
  const safeAdminAccounts = adminAccounts || [];

  const customerNav = [
    {
      group: 'Bookings',
      items: [
        { id: 'cust-book', label: 'Book a Service', icon: CalendarPlus },
        {
          id: 'cust-bookings',
          label: 'My Bookings',
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
        { id: 'cust-profile', label: 'Profile', icon: User }
      ]
    }
  ];

  // Professional navigation items (No Marketplace, No Earnings per specification)
  const professionalNav = [
    {
      group: 'Workforce',
      items: [
        { id: 'work-dash', label: 'My Dashboard', icon: LayoutDashboard },
        {
          id: 'work-jobs',
          label: 'Assigned Jobs',
          icon: ClipboardList,
          count: safeBookings.filter(
            (b) =>
              b &&
              b.professional_id === currentUser?.id &&
              (b.status === 'assigned' || b.status === 'in_progress')
          ).length
        },
        { id: 'work-profile', label: 'Skills & Safety Profile', icon: ShieldCheck }
      ]
    }
  ];

  // Admin navigation items
  const adminNav = [
    {
      group: 'Overview',
      items: [
        { id: 'adm-overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'adm-reports', label: 'Analytics & Reports', icon: FileBarChart }
      ]
    },
    {
      group: 'Operations',
      items: [
        {
          id: 'adm-bookings',
          label: 'All Bookings',
          icon: BookOpen,
          count: safeBookings.filter((b) => b && b.status === 'requested').length
        },
        {
          id: 'adm-workforce',
          label: 'Professionals',
          icon: Users,
          count: safeProfessionals.filter((p) => p && p.status === 'pending_verification').length
        },
        { id: 'adm-services', label: 'Service Catalog', icon: Briefcase },
        {
          id: 'adm-safety',
          label: 'Safety & Incidents',
          icon: AlertTriangle,
          count: safeIncidents.filter((i) => i && i.status === 'open').length
        }
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
          label: 'Manage Admins',
          icon: ShieldAlert,
          count: safeAdminAccounts.length
        },
        { id: 'sadm-scheduling', label: 'Region Scheduling', icon: Sliders },
        { id: 'sadm-audit', label: 'Platform Audit Log', icon: FileCheck },
        { id: 'sadm-profile', label: 'Security & Password', icon: KeyRound }
      ]
    },
    {
      group: 'Platform Operations (Full Authority)',
      items: [
        { id: 'adm-overview', label: 'Dashboard Overview', icon: LayoutDashboard },
        {
          id: 'adm-bookings',
          label: 'All Bookings',
          icon: BookOpen,
          count: safeBookings.filter((b) => b && b.status === 'requested').length
        },
        {
          id: 'adm-workforce',
          label: 'Professionals',
          icon: Users,
          count: safeProfessionals.filter((p) => p && p.status === 'pending_verification').length
        },
        { id: 'adm-services', label: 'Service Catalog', icon: Briefcase },
        {
          id: 'adm-safety',
          label: 'Safety & Incidents',
          icon: AlertTriangle,
          count: safeIncidents.filter((i) => i && i.status === 'open').length
        },
        { id: 'adm-reports', label: 'Analytics & Reports', icon: FileBarChart }
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
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand">
        <div className="brand-mark">🌴</div>
        <div className="brand-text">
          <div className="t1">Coconut Plucker</div>
          <div className="t2">SKILLED HEIGHT WORK, ON DEMAND</div>
        </div>
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
              {getDisplayName(currentUser)
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
              {getDisplayName(currentUser)}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#8CAABB',
                textTransform: 'capitalize'
              }}
            >
              {currentUser?.role} {currentUser?.taluka ? `· ${currentUser.taluka}` : ''}
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
                  onClick={() => setCurrentView(item.id)}
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
          onClick={logout}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
