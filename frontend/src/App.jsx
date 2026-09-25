import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/common/Toast';

// Auth Page
import { AuthPage } from './pages/AuthPage';

// Super Admin Pages
import { SuperAdminAdmins } from './pages/SuperAdminAdmins';
import { SuperAdminProfile } from './pages/SuperAdminProfile';
import { SuperAdminScheduling } from './pages/SuperAdminScheduling';
import { SuperAdminAudit } from './pages/SuperAdminAudit';

// Customer Pages
import { BookingWizard } from './components/customer/BookingWizard';
import { CustomerBookings } from './pages/CustomerBookings';
import { CustomerProfile } from './pages/CustomerProfile';

// Professional Pages
import { ProfessionalDashboard } from './pages/ProfessionalDashboard';
import { ProfessionalJobs } from './pages/ProfessionalJobs';
import { ProfessionalProfile } from './pages/ProfessionalProfile';

// Admin Pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminBookings } from './pages/AdminBookings';
import { AdminWorkforce } from './pages/AdminWorkforce';
import { AdminServices } from './pages/AdminServices';
import { AdminSafety } from './pages/AdminSafety';
import { AdminReports } from './pages/AdminReports';

// Modals
import { ServiceFormModal } from './components/admin/ServiceFormModal';
import { IncidentLogModal } from './components/admin/IncidentLogModal';

const MainLayout = () => {
  const { currentUser, role } = useAuth();
  const { currentView, setCurrentView, addService, addIncident, professionals, bookings } = useApp();

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isLogIncidentOpen, setIsLogIncidentOpen] = useState(false);

  // Sync initial view when role changes
  useEffect(() => {
    if (role === 'super_admin') {
      if (currentUser?.must_reset_password) {
        setCurrentView('sadm-profile');
      } else if (![
        'sadm-admins',
        'sadm-profile',
        'sadm-scheduling',
        'sadm-audit',
        'adm-overview',
        'adm-bookings',
        'adm-workforce',
        'adm-services',
        'adm-safety',
        'adm-reports'
      ].includes(currentView)) {
        setCurrentView('sadm-admins');
      }
    } else if (role === 'customer' && !['cust-book', 'cust-bookings', 'cust-profile'].includes(currentView)) {
      setCurrentView('cust-book');
    } else if (role === 'professional' && !['work-dash', 'work-jobs', 'work-profile'].includes(currentView)) {
      setCurrentView('work-dash');
    } else if (role === 'admin' && !['adm-overview', 'adm-bookings', 'adm-workforce', 'adm-services', 'adm-safety', 'adm-reports'].includes(currentView)) {
      setCurrentView('adm-overview');
    }
  }, [role, currentView, setCurrentView, currentUser?.must_reset_password]);

  // Route renderer with Super Admin first-login password-reset enforcement
  const renderCurrentView = () => {
    // Force Super Admin to set password if must_reset_password flag is true
    if (role === 'super_admin' && currentUser?.must_reset_password) {
      return <SuperAdminProfile />;
    }

    switch (currentView) {
      // Super Admin Views
      case 'sadm-admins':
        return <SuperAdminAdmins />;
      case 'sadm-profile':
        return <SuperAdminProfile />;
      case 'sadm-scheduling':
        return <SuperAdminScheduling />;
      case 'sadm-audit':
        return <SuperAdminAudit />;

      // Customer Views
      case 'cust-book':
        return <BookingWizard onComplete={() => setCurrentView('cust-bookings')} />;
      case 'cust-bookings':
        return <CustomerBookings />;
      case 'cust-profile':
        return <CustomerProfile />;

      // Professional Views
      case 'work-dash':
        return <ProfessionalDashboard />;
      case 'work-jobs':
        return <ProfessionalJobs />;
      case 'work-profile':
        return <ProfessionalProfile />;

      // Admin Views (Reused directly by Super Admin as a full superset)
      case 'adm-overview':
        return <AdminDashboard />;
      case 'adm-bookings':
        return <AdminBookings />;
      case 'adm-workforce':
        return <AdminWorkforce />;
      case 'adm-services':
        return <AdminServices />;
      case 'adm-safety':
        return <AdminSafety />;
      case 'adm-reports':
        return <AdminReports />;

      default:
        return role === 'super_admin' ? (
          <SuperAdminAdmins />
        ) : role === 'customer' ? (
          <BookingWizard onComplete={() => setCurrentView('cust-bookings')} />
        ) : role === 'professional' ? (
          <ProfessionalDashboard />
        ) : (
          <AdminDashboard />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Role-aware Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="main-content">
        <Topbar
          onOpenAddService={() => setIsAddServiceOpen(true)}
          onOpenLogIncident={() => setIsLogIncidentOpen(true)}
        />

        <div className="content-body">{renderCurrentView()}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Toast Feedback */}
      <ToastContainer />

      {/* Admin Modals */}
      <ServiceFormModal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        onSave={addService}
      />

      <IncidentLogModal
        isOpen={isLogIncidentOpen}
        onClose={() => setIsLogIncidentOpen(false)}
        onLog={addIncident}
        professionals={professionals}
        bookings={bookings}
      />
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Render Error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Storage clear error:', e);
    }
    window.location.href = window.location.origin;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--cream)',
          padding: '20px',
          fontFamily: 'var(--font-body)',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '32px 28px',
            maxWidth: '520px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🌴</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--ink)' }}>
              Application Reset Required
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', marginBottom: '16px', lineHeight: 1.5 }}>
              A cached data mismatch was detected in your browser session. Click below to reset to clean state and continue.
            </p>
            {this.state.error?.message && (
              <pre style={{
                textAlign: 'left',
                background: 'rgba(179, 64, 44, 0.08)',
                color: 'var(--danger)',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                marginBottom: '16px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              style={{
                background: 'linear-gradient(180deg, var(--teal-light), var(--teal))',
                color: '#FFFFFF',
                padding: '10px 22px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Reset App Data & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppRoot = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <AppRoot />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
