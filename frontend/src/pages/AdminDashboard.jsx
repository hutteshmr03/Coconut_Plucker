import React from 'react';
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
  CheckCircle2
} from 'lucide-react';

export const AdminDashboard = () => {
  const {
    bookings,
    services,
    professionals,
    incidents,
    customers,
    setCurrentView
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

                  return (
                    <div
                      key={b.id}
                      className="list-item"
                      style={{ padding: '12px 0' }}
                    >
                      <div className="li-dot amber" />
                      <div className="li-main">
                        <div className="li-title">
                          {svc?.icon} {svc?.name} · {b.booking_number}
                        </div>
                        <div className="li-sub">
                          Customer: {getDisplayName(cust)} · Taluka: <b>{b.taluka}</b> · {b.tree_count} trees
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setCurrentView('adm-bookings')}
                        >
                          Assign Pro
                        </Button>
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
