import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getDisplayName } from '../utils/helpers';
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
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.actual_amount || b.quote_amount || 0), 0);

  // Demand breakdown by service
  const demandByService = services.map((svc) => {
    const count = bookings.filter((b) => b.service_id === svc.id).length;
    return { service: svc, count };
  });
  const maxDemand = Math.max(1, ...demandByService.map((d) => d.count));

  // Top professionals
  const topPros = [...professionals]
    .sort((a, b) => b.rating_avg - a.rating_avg)
    .slice(0, 4);

  return (
    <div>
      {/* Stat Grid */}
      <div className="stat-grid">
        <div className="stat-card" style={{ '--accent': 'var(--teal)' }}>
          <div className="stat-label">Pending Booking Requests</div>
          <div className="stat-value">{pendingRequests.length}</div>
          <div className="stat-foot warn">requires professional assignment</div>
        </div>

        <div className="stat-card" style={{ '--accent': 'var(--gold)' }}>
          <div className="stat-label">Total Realized Revenue</div>
          <div className="stat-value">₹{totalRevenue.toLocaleString('en-IN')}</div>
          <div className="stat-foot up">from completed tree services</div>
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
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Bookings Awaiting Assignment</h3>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('adm-bookings')}>
              View All Bookings ({totalBookings}) →
            </Button>
          </div>

          <Card>
            {pendingRequests.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingRequests.map((b) => {
                  const svc = services.find((s) => s.id === b.service_id);
                  const cust = customers.find((c) => c.id === b.customer_id);

                  const isCallPending = b.booking_type === 'urgent' && !b.call_confirmed;

                  return (
                    <div
                      key={b.id}
                      className="list-item"
                      style={{ padding: '12px 0' }}
                    >
                      <div className={`li-dot ${isCallPending ? 'gold' : 'amber'}`} />
                      <div className="li-main">
                        <div className="li-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{svc?.icon} {svc?.name} · {b.booking_number}</span>
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
                        <div className="li-sub" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
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
                          <span>· Taluka: <b>{b.taluka}</b> · {b.tree_count} trees</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
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
                            Assign Pro
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
          <Card style={{ marginTop: '20px' }}>
            <h3>Service Volume & Demand Distribution</h3>
            <div style={{ marginTop: '16px' }}>
              {demandByService.map(({ service, count }) => {
                const pct = Math.round((count / maxDemand) * 100);
                return (
                  <div key={service.id} className="bar-row">
                    <div className="lbl" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{service.icon}</span>
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
        <div>
          {/* Top Rated Workforce */}
          <Card style={{ marginBottom: '20px' }}>
            <h3>Top Verified Climbers</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {topPros.map((pro) => (
                <div key={pro.id} className="list-item">
                  <div className="worker-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                    {getDisplayName(pro).split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="li-main">
                    <div className="li-title">{getDisplayName(pro)}</div>
                    <div className="li-sub">
                      Taluka: {pro.taluka} · {pro.experience_years} yrs exp
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', color: 'var(--gold)' }}>
                    ★ {pro.rating_avg}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Action Navigation */}
          <Card>
            <h3>Quick Operations Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <Button
                variant="ghost"
                className="btn-block"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => setCurrentView('adm-services')}
              >
                🛠️ Manage Service Catalog
              </Button>
              <Button
                variant="ghost"
                className="btn-block"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => setCurrentView('sadm-scheduling')}
              >
                🗓️ Regional Scheduling Governance
              </Button>
              <Button
                variant="ghost"
                className="btn-block"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => setCurrentView('adm-workforce')}
              >
                👥 Verify Professional Profiles ({pendingVerifications.length})
              </Button>
              <Button
                variant="ghost"
                className="btn-block"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => setCurrentView('adm-safety')}
              >
                ⚠️ Safety & Incident Log ({openIncidents.length})
              </Button>
              <Button
                variant="ghost"
                className="btn-block"
                style={{ justifyContent: 'flex-start' }}
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
