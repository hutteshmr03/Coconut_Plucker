import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { AssignedJobCard } from '../components/professional/AssignedJobCard';
import { SafetyChecklistModal } from '../components/professional/SafetyChecklistModal';
import { CompleteJobModal } from '../components/professional/CompleteJobModal';
import { EmptyState } from '../components/common/EmptyState';
import { Briefcase } from 'lucide-react';

export const ProfessionalJobs = () => {
  const { currentUser } = useAuth();
  const {
    currentProfessional,
    bookings,
    services,
    customers,
    startJob,
    completeJob
  } = useApp();

  const [filter, setFilter] = useState('all'); // 'all' | 'assigned' | 'in_progress' | 'completed'
  const [safetyModalBooking, setSafetyModalBooking] = useState(null);
  const [completeModalBooking, setCompleteModalBooking] = useState(null);

  const activeProId = currentUser?.id || currentProfessional?.id;
  const myBookings = bookings
    .filter((b) => b.professional_id === activeProId || b.professional_id === currentUser?.id)
    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

  const filtered = myBookings.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3>Assigned Work Orders ({myBookings.length})</h3>
          <p className="cell-muted">
            All customer bookings assigned to you by Admin in {currentProfessional?.taluka} Taluka.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tag-strip">
        <button
          className={`tab-pill ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Assigned ({myBookings.length})
        </button>
        <button
          className={`tab-pill ${filter === 'assigned' ? 'active' : ''}`}
          onClick={() => setFilter('assigned')}
        >
          Assigned / Ready ({myBookings.filter((b) => b.status === 'assigned').length})
        </button>
        <button
          className={`tab-pill ${filter === 'in_progress' ? 'active' : ''}`}
          onClick={() => setFilter('in_progress')}
        >
          In Progress ({myBookings.filter((b) => b.status === 'in_progress').length})
        </button>
        <button
          className={`tab-pill ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({myBookings.filter((b) => b.status === 'completed').length})
        </button>
      </div>

      {filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map((b) => {
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
        <EmptyState
          icon={Briefcase}
          title="No Bookings in this Category"
          description="There are currently no assigned bookings matching the selected filter."
        />
      )}

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
