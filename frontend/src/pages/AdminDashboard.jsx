import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getDisplayName, getCleanServiceIcon } from '../utils/helpers';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import {
  Users,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  Phone
} from 'lucide-react';

export const AdminDashboard = () => {
  const { role } = useAuth();
  const {
    bookings,
    services,
    professionals,
    incidents,
    customers,
    setCurrentView,
    confirmBookingCall
  } = useApp();

  const totalBookings = bookings.length;
  const activeBookings = bookings.filter(
    (b) => b.status === 'requested' || b.status === 'assigned' || b.status === 'in_progress'
  );
  const pendingRequests = bookings.filter((b) => b.status === 'requested');
  const pendingVerifications = professionals.filter(
    (p) => p.status === 'pending_verification'
  );
  const openIncidents = incidents.filter((i) => i.status === 'open');

  const totalRevenue = bookings
    .filter((b) => b.status !== 'cancelled' && b.status !== 'rejected')
    .reduce((sum, b) => sum + Number(b.actual_amount || b.quote_amount || 0), 0);

  // Demand breakdown by service
  const demandByService = services.map((svc) => {
    const count = bookings.filter((b) => b.service_id === svc.id).length;
    return { service: svc, count };
  });
  const maxDemand = Math.max(1, ...demandByService.map((d) => d.count));

  // Top professionals
  const topPros = [...professionals]
    .sort((a, b) => (Number(b.experience_years) || 0) - (Number(a.experience_years) || 0))
    .slice(0, 4);

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      {/* Stat Grid */}
      <div className="stat-grid">
        <div className="stat-card" style={{ '--accent': 'var(--teal)' }}>
          <div className="stat-label">Pending Booking Requests</div>
          <div className="stat-value">{pendingRequests.length}</div>
          <div className="stat-foot warn">requires professional assignment</div>
        </div>

        <div className="stat-card" style={{ '--accent': 'var(--gold)' }}>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">₹{totalRevenue.toLocaleString('en-IN')}</div>
          <div className="stat-foot up">from booked tree services</div>
        </div>

        <div className="stat-card" style={{ '--accent': 'var(--leaf)' }}>
          <div className="stat-label">Pending Verifications</div>
          <div className="stat-value">{pendingVerifications.length}</div>
          <div className="stat-foot">professionals awaiting review</div>
        </div>

        <div className="stat-card" style={{ '--accent': 'var(--navy)' }}>
          <div className="stat-label">Safety & Field Reports</div>
          <div className="stat-value">{openIncidents.length}</div>
          <div className="stat-foot">active near-miss / audits</div>
        </div>
      </div>

      <div className="dash-grid">
        {/* Needs Assignment Queue */}
        <div className="adm-dash-col">
          <div className="adm-section-head">
            <h3>Bookings Awaiting Assignment</h3>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('adm-bookings')}>
              View All Bookings ({totalBookings}) →
            </Button>
          </div>

          <Card>
            {pendingRequests.length > 0 ? (
              <div className="adm-booking-list">
                {pendingRequests.map((b) => {
                  const svc = services.find((s) => s.id === b.service_id);
                  const cust = customers.find((c) => c.id === b.customer_id);

                  const isCallPending = b.booking_type === 'urgent' && !b.call_confirmed;

                  return (
                    <div key={b.id} className="adm-booking-row">
                      <div className="li-main" style={{ minWidth: 0, flex: 1 }}>
                        <div className="li-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>{getCleanServiceIcon(svc)} {svc?.name} · {b.booking_number}</span>
                          {b.booking_type === 'urgent' && (
                            <span
                              style={{
                                padding: '1px 6px',
                                borderRadius: '10px',
                                backgroundColor: '#FEF3C7',
                                color: '#D97706',
                                fontSize: '10px',
                                fontWeight: 700,
                                border: '1px solid #FDE68A'
                              }}
                            >
                              ⚡ URGENT
                            </span>
                          )}
                        </div>
                        <div className="li-sub adm-booking-meta">
                          <span>Customer: <b>{getDisplayName(cust)}</b></span>
                          {cust?.phone && (
                            <a
                              href={`tel:${String(cust.phone).replace(/[^0-9+]/g, '')}`}
                              className="phone-link-pill"
                              title={`Click to call ${getDisplayName(cust)} (${cust.phone})`}
                            >
                              <Phone size={10} />
                              <span>{cust.phone}</span>
                            </a>
                          )}
                          <span>· Taluka: <b>{b.taluka}</b></span>
                          <span>· {b.tree_count} trees</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, alignSelf: 'center' }}>
                        {isCallPending ? (
                          <Button
                            variant="gold"
                            size="sm"
                            icon={PhoneCall}
                            onClick={() => {
                              const rawPhone = cust?.phone || b.customer_phone || b.phone || '';
                              const cleanPhone = String(rawPhone).replace(/[^0-9+]/g, '');
                              if (cleanPhone) {
                                window.location.href = `tel:${cleanPhone}`;
                              }
                              confirmBookingCall(b.id, cust);
                            }}
                            title={`Call customer (${cust?.phone || 'Customer'}) to verify and confirm`}
                          >
                            Confirm via Call
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setCurrentView('adm-bookings')}
                          >
                            Assign Job
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-soft)' }}>
                <CheckCircle2 size={32} color="var(--success)" style={{ margin: '0 auto 8px' }} />
                <b>All Bookings Assigned!</b>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>
                  No pending customer requests awaiting workforce dispatch.
                </p>
              </div>
            )}
          </Card>

          {/* Service Demand Breakdown */}
          <Card className="adm-demand-card">
            <h3>Service Volume & Demand Distribution</h3>
            <div>
              {demandByService.map(({ service, count }) => {
                const pct = Math.round((count / maxDemand) * 100);
                return (
                  <div key={service.id} className="bar-row">
                    <div className="lbl" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span>{getCleanServiceIcon(service)}</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {service.name.split(' ')[0]}
                      </span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="bar-val">{count} jobs</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Sidebar Widgets */}
        <div className="adm-dash-col">
          {/* Top Rated Workforce */}
          <Card style={{ marginBottom: '20px' }}>
            <h3>Top Verified Climbers</h3>
            <div className="adm-pro-list">
              {topPros.map((pro) => (
                <div key={pro.id} className="adm-pro-row">
                  <div className="worker-avatar" style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                    {getDisplayName(pro).split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="li-main">
                    <div className="li-title">{getDisplayName(pro)}</div>
                    <div className="li-sub">
                      Taluka: {pro.taluka} · {pro.experience_years} yrs exp
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span className="badge green" style={{ fontSize: '11px', padding: '3px 9px' }}>Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Action Navigation */}
          <Card className="adm-quick-card">
            <h3>Quick Operations Actions</h3>
            <div className="adm-quick-actions">
              <Button
                variant="ghost"
                className="btn-block adm-quick-btn"
                onClick={() => setCurrentView('adm-services')}
              >
                🛠️ Manage Service Catalog
              </Button>
              <Button
                variant="ghost"
                className="btn-block adm-quick-btn"
                onClick={() => setCurrentView('sadm-scheduling')}
              >
                🗓️ Taluka Days Scheduling
              </Button>
              <Button
                variant="ghost"
                className="btn-block adm-quick-btn"
                onClick={() => setCurrentView('adm-workforce')}
              >
                👥 Verify Professional Profiles ({pendingVerifications.length})
              </Button>
              <Button
                variant="ghost"
                className="btn-block adm-quick-btn"
                onClick={() => setCurrentView('adm-safety')}
              >
                ⚠️ Safety & Incident Log ({openIncidents.length})
              </Button>
              <Button
                variant="ghost"
                className="btn-block adm-quick-btn"
                onClick={() => setCurrentView(role === 'super_admin' ? 'sadm-profile' : 'adm-profile')}
              >
                🔑 Security & Credentials
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
