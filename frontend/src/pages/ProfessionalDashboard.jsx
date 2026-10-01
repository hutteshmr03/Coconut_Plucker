import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { AssignedJobCard } from '../components/professional/AssignedJobCard';
import { SafetyChecklistModal } from '../components/professional/SafetyChecklistModal';
import { CompleteJobModal } from '../components/professional/CompleteJobModal';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { ShieldCheck, Star, Briefcase, CheckCircle, Check } from 'lucide-react';

export const ProfessionalDashboard = () => {
  const { currentUser } = useAuth();
  const {
    currentProfessional,
    bookings,
    services,
    customers,
    startJob,
    completeJob,
    setCurrentView
  } = useApp();

  const [safetyModalBooking, setSafetyModalBooking] = useState(null);
  const [completeModalBooking, setCompleteModalBooking] = useState(null);

  const activeProId = currentUser?.id || currentProfessional?.id;
  const myBookings = bookings.filter(
    (b) => b.professional_id === activeProId || b.professional_id === currentUser?.id
  );

  const activeJobs = myBookings.filter(
    (b) => b.status === 'assigned' || b.status === 'in_progress'
  );

  const completedJobs = myBookings.filter((b) => b.status === 'completed');

  return (
    <div>
      {/* KPI Stat Grid */}
      <div className="stat-grid">
        <div className="stat-card" style={{ '--accent': 'var(--teal)' }}>
          <div className="stat-label">Active Assigned Jobs</div>
          <div className="stat-value">{activeJobs.length}</div>
          <div className="stat-foot">ready or in-progress</div>
        </div>

        <div className="stat-card" style={{ '--accent': 'var(--gold)' }}>
          <div className="stat-label">Jobs Completed</div>
          <div className="stat-value">{completedJobs.length}</div>
          <div className="stat-foot">all-time tree jobs</div>
        </div>

        <div className="stat-card" style={{ '--accent': 'var(--leaf)' }}>
          <div className="stat-label">Average Rating</div>
          <div className="stat-value">★ {currentProfessional?.rating_avg || 5.0}</div>
          <div className="stat-foot">from customer reviews</div>
        </div>

        <div className="stat-card" style={{ '--accent': 'var(--navy)' }}>
          <div className="stat-label">Verification Status</div>
          <div style={{ marginTop: '10px' }}>
            <StatusBadge status={currentProfessional?.status || 'approved'} />
          </div>
          <div className="stat-foot" style={{ marginTop: '10px' }}>
            {currentProfessional?.taluka} Taluka
          </div>
        </div>
      </div>

      <div className="dash-grid">
        {/* Active Work Queue */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '36px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Assigned Work Queue</h3>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('work-jobs')}>
              View All Jobs ({myBookings.length}) →
            </Button>
          </div>

          {activeJobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeJobs.slice(0, 3).map((b) => {
                const svc = services.find((s) => s.id === b.service_id);
                const cust = customers.find((c) => c.id === b.customer_id);
                return (
                  <AssignedJobCard
                    key={b.id}
                    booking={b}
                    service={svc}
                    customer={cust}
                    onStartJob={(job) => setSafetyModalBooking(job)}
                    onCompleteJob={(job) => setCompleteModalBooking(job)}
                  />
                );
              })}
            </div>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--ink-soft)' }}>
                <CheckCircle size={36} color="var(--success)" style={{ margin: '0 auto 10px' }} />
                <b style={{ display: 'block', fontSize: '15px', color: 'var(--ink)' }}>
                  All Caught Up!
                </b>
                <p style={{ fontSize: '12.5px', marginTop: '4px' }}>
                  No pending assigned jobs right now. You will be notified when Admin assigns a booking in {currentProfessional?.taluka}.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Safety & Compliance Card */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '36px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Safety & Certification Status</h3>
          </div>
          <Card>
            <div className="kpi-line">
              <span>Safety Certification</span>
              <b>{currentProfessional?.safety_cert || 'Certified Master Climber (Govt. CPCRI)'}</b>
            </div>
            <div className="kpi-line">
              <span>Climbing Experience</span>
              <b>{currentProfessional?.experience_years || 5} years</b>
            </div>
            <div className="kpi-line">
              <span>Primary Taluka</span>
              <b>{currentProfessional?.taluka}</b>
            </div>
            <div className="kpi-line">
              <span>Accident Insurance</span>
              <b style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Check size={15} strokeWidth={3} /> Active Platform Cover
              </b>
            </div>

            <div style={{ marginTop: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Active Service Capabilities
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {currentProfessional?.skills?.map((sid) => {
                  const s = services.find((x) => x.id === sid);
                  return (
                    <span
                      key={sid}
                      style={{
                        background: 'var(--cream)',
                        border: '1px solid var(--line)',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {s?.icon} {s?.name}
                    </span>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <Button
                variant="ghost"
                size="md"
                className="btn-block"
                style={{ width: '100%', height: '44px' }}
                onClick={() => setCurrentView('work-profile')}
              >
                Manage Profile & Skills
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <SafetyChecklistModal
        isOpen={!!safetyModalBooking}
        onClose={() => setSafetyModalBooking(null)}
        booking={safetyModalBooking}
        onConfirm={startJob}
      />

      <CompleteJobModal
        isOpen={!!completeModalBooking}
        onClose={() => setCompleteModalBooking(null)}
        booking={completeModalBooking}
        onConfirm={completeJob}
      />
    </div>
  );
};
