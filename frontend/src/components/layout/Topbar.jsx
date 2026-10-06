import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getDisplayName } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { Plus, User, ShieldCheck, LogOut, ShieldAlert, Menu } from 'lucide-react';

export const Topbar = ({ onOpenAddService, onOpenLogIncident }) => {
  const { currentUser, role, logout } = useAuth();
  const { currentView, setCurrentView, setIsMobileSidebarOpen } = useApp();
  const { t, language } = useLanguage();

  const getPageMeta = () => {
    switch (currentView) {
      // Super Admin Exclusive Views
      case 'sadm-admins':
        return {
          title: t('top_adm_admins_title'),
          sub: t('top_adm_admins_sub')
        };
      case 'sadm-scheduling':
        return {
          title: t('top_adm_scheduling_title'),
          sub: t('top_adm_scheduling_sub')
        };
      case 'sadm-audit':
        return {
          title: t('top_adm_audit_title'),
          sub: t('top_adm_audit_sub')
        };
      case 'sadm-profile':
        return {
          title: t('nav_super_profile'),
          sub: 'Manage singleton Super Admin credentials and change access password'
        };
      case 'adm-profile':
        return {
          title: t('top_adm_profile_title', 'Administrator Profile'),
          sub: t('top_adm_profile_sub', 'Manage administrator account details, regional scope, and credentials')
        };

      // Customer Views
      case 'cust-book':
        return {
          title: t('top_book_service_title'),
          sub: t('top_book_service_sub')
        };
      case 'cust-bookings':
        return {
          title: t('top_my_bookings_title'),
          sub: t('top_my_bookings_sub')
        };
      case 'cust-profile':
        return {
          title: t('top_cust_profile_title'),
          sub: t('top_cust_profile_sub')
        };

      // Professional Views
      case 'work-dash':
        return {
          title: t('top_pro_dash_title'),
          sub: t('top_pro_dash_sub')
        };
      case 'work-jobs':
        return {
          title: t('top_pro_jobs_title'),
          sub: t('top_pro_jobs_sub')
        };
      case 'work-profile':
        return {
          title: t('top_pro_profile_title'),
          sub: t('top_pro_profile_sub')
        };

      // Admin Views (Also accessible by Super Admin)
      case 'adm-overview':
        return {
          title: t('top_adm_overview_title'),
          sub: t('top_adm_overview_sub')
        };
      case 'adm-bookings':
        return {
          title: t('nav_all_bookings'),
          sub: 'Review customer requests and assign skilled professionals'
        };
      case 'adm-workforce':
        return {
          title: t('nav_workforce'),
          sub: 'Manage verification status and professional skills'
        };
      case 'adm-services':
        return {
          title: t('nav_catalog'),
          sub: 'Configure base rates, units, and height category requirements'
        };
      case 'adm-safety':
        return {
          title: t('top_adm_safety_title'),
          sub: t('top_adm_safety_sub')
        };
      case 'adm-reports':
        return {
          title: t('top_adm_reports_title'),
          sub: t('top_adm_reports_sub')
        };
      default:
        return { title: t('brand_name'), sub: t('brand_sub') };
    }
  };

  const meta = getPageMeta();

  return (
    <header className="topbar">
      <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Open Navigation Menu"
          title="Open Menu"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1>{meta.title}</h1>
        </div>
      </div>

      <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>



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

        {/* Global Language Switcher */}
        <LanguageSwitcher theme="light" />

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
          <span>{getDisplayName(currentUser, language)}</span>

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
              {t('super_admin_badge')}
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
              {t('verified')}
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
              {t('admin_badge')}
            </span>
          )}

          {role === 'customer' && (
            <User size={14} color="var(--teal)" />
          )}
        </div>
      </div>
    </header>
  );
};
