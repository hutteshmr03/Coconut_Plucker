import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDisplayName } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { Plus, User, ShieldCheck, LogOut, ShieldAlert } from 'lucide-react';

export const Topbar = ({ onOpenAddService, onOpenLogIncident }) => {
  const { currentUser, role, logout } = useAuth();
  const { currentView, setCurrentView } = useApp();

  const getPageMeta = () => {
    switch (currentView) {
      // Super Admin Exclusive Views
      case 'sadm-admins':
        return {
          title: 'Administrator Management',
          sub: 'Provision, configure, and deactivate platform administrator accounts'
        };
      case 'sadm-scheduling':
        return {
          title: 'Regional Scheduling Governance',
          sub: 'Manage Taluka schedule day mappings and daily dispatch capacity limits'
        };
      case 'sadm-audit':
        return {
          title: 'Platform-Wide Audit Trail',
          sub: 'Searchable log of all administrator operations and compliance events'
        };
      case 'sadm-profile':
        return {
          title: 'Super Admin Security & Password',
          sub: 'Manage singleton Super Admin credentials and change access password'
        };

      // Customer Views
      case 'cust-book':
        return {
          title: 'Book a Service',
          sub: 'Standardized rates, safety-certified climbers & instant quote'
        };
      case 'cust-bookings':
        return {
          title: 'My Bookings',
          sub: 'Track active bookings, payment, and submit professional reviews'
        };
      case 'cust-profile':
        return {
          title: 'Customer Profile',
          sub: 'Manage your contact details and default Taluka'
        };

      // Professional Views
      case 'work-dash':
        return {
          title: 'Professional Dashboard',
          sub: 'Assigned bookings, pre-climb safety checklists, and job management'
        };
      case 'work-jobs':
        return {
          title: 'Assigned Bookings',
          sub: 'Perform pre-climb safety checklists, start jobs, and mark completion'
        };
      case 'work-profile':
        return {
          title: 'Skills & Safety Profile',
          sub: 'Manage experience, safety certification, and service capabilities'
        };

      // Admin Views (Also accessible by Super Admin)
      case 'adm-overview':
        return {
          title: role === 'super_admin' ? 'Operations Overview (Full Authority)' : 'Admin Operations Overview',
          sub: 'Live overview of bookings, workforce verification, and service metrics'
        };
      case 'adm-bookings':
        return {
          title: 'Booking Management',
          sub: 'Review customer requests and assign skilled professionals'
        };
      case 'adm-workforce':
        return {
          title: 'Professional Workforce',
          sub: 'Manage verification status and professional skills'
        };
      case 'adm-services':
        return {
          title: 'Service Catalog Management',
          sub: 'Configure base rates, units, and height category requirements'
        };
      case 'adm-safety':
        return {
          title: 'Safety & Incident Reports',
          sub: 'Track near-misses, equipment audits, and field safety logs'
        };
      case 'adm-reports':
        return {
          title: 'Analytics & Revenue Reports',
          sub: 'Volume breakdown, revenue realization, and service demand'
        };
      default:
        return { title: 'Coconut Plucker', sub: 'Skilled height work on demand' };
    }
  };

  const meta = getPageMeta();

  return (
    <header className="topbar">
      <div>
        <h1>{meta.title}</h1>
        <div className="sub">{meta.sub}</div>
      </div>

      <div className="top-actions">
        {role === 'customer' && currentView !== 'cust-book' && (
          <Button
            variant="gold"
            size="sm"
            icon={Plus}
            onClick={() => setCurrentView('cust-book')}
          >
            Book a Service
          </Button>
        )}

        {(role === 'admin' || role === 'super_admin') && currentView === 'adm-services' && (
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={onOpenAddService}
          >
            Add Service
          </Button>
        )}

        {(role === 'admin' || role === 'super_admin') && currentView === 'adm-safety' && (
          <Button
            variant="danger"
            size="sm"
            icon={Plus}
            onClick={onOpenLogIncident}
          >
            Log Safety Incident
          </Button>
        )}

        {/* User Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--cream)',
            padding: '5px 10px 5px 14px',
            borderRadius: '20px',
            border: '1px solid var(--line)',
            fontSize: '12.5px',
            fontWeight: '600'
          }}
        >
          <span>{getDisplayName(currentUser)}</span>

          {role === 'super_admin' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(124, 58, 237, 0.14)',
                color: '#6D28D9',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
              <ShieldAlert size={12} color="#6D28D9" strokeWidth={2.5} />
              Super Admin
            </span>
          )}

          {role === 'professional' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(216, 163, 61, 0.18)',
                color: '#8a6a1f',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
              <ShieldCheck size={12} color="#8a6a1f" strokeWidth={2.5} />
              Verified
            </span>
          )}

          {role === 'admin' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(22, 60, 86, 0.12)',
                color: 'var(--navy-mid)',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
              <ShieldCheck size={12} color="var(--navy-mid)" strokeWidth={2.5} />
              Admin
            </span>
          )}

          {role === 'customer' && (
            <User size={14} color="var(--teal)" />
          )}
        </div>

        {/* Sign Out Button */}
        <button
          className="icon-btn"
          title="Sign Out"
          onClick={logout}
          style={{ color: 'var(--amber)' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
