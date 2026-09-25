import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getDisplayName } from '../utils/helpers';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { AssignWorkerModal } from '../components/admin/AssignWorkerModal';
import { Search, UserPlus, PhoneCall, Check, Zap } from 'lucide-react';

export const AdminBookings = () => {
  const {
    bookings,
    services,
    professionals,
    customers,
    assignBooking,
    confirmBookingCall
  } = useApp();

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningBooking, setAssigningBooking] = useState(null);

  const filteredBookings = bookings
    .filter((b) => {
      if (statusFilter === 'pending_call') {
        return b.booking_type === 'urgent' && !b.call_confirmed && b.status === 'requested';
      }
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const cust = customers.find((c) => c.id === b.customer_id);
      const svc = services.find((s) => s.id === b.service_id);
      const pro = professionals.find((p) => p.id === b.professional_id);

      return (
        b.booking_number.toLowerCase().includes(q) ||
        b.taluka.toLowerCase().includes(q) ||
        (cust && getDisplayName(cust).toLowerCase().includes(q)) ||
        (svc && svc.name.toLowerCase().includes(q)) ||
        (pro && getDisplayName(pro).toLowerCase().includes(q))
      );
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const pendingCallCount = bookings.filter(
    (b) => b.booking_type === 'urgent' && !b.call_confirmed && b.status === 'requested'
  ).length;

  return (
    <div>
      {/* Filter Tabs */}
      <div className="tag-strip">
        {[
          { key: 'all', label: `All (${bookings.length})` },
          ...(pendingCallCount > 0
            ? [{ key: 'pending_call', label: `📞 Urgent Call Needed (${pendingCallCount})` }]
            : []),
          { key: 'requested', label: `Pending Assignment (${bookings.filter((b) => b.status === 'requested').length})` },
          { key: 'assigned', label: `Assigned (${bookings.filter((b) => b.status === 'assigned').length})` },
          { key: 'in_progress', label: `In Progress (${bookings.filter((b) => b.status === 'in_progress').length})` },
          { key: 'completed', label: `Completed (${bookings.filter((b) => b.status === 'completed').length})` }
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab-pill ${statusFilter === tab.key ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} color="var(--ink-soft)" />
          <input
            type="text"
            placeholder="Search by booking #, customer, service, or Taluka..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ minWidth: '120px' }}>Booking & Date</th>
              <th style={{ minWidth: '150px' }}>Customer & Location</th>
              <th style={{ minWidth: '160px' }}>Service & Qty</th>
              <th style={{ minWidth: '160px' }}>Assigned Climber</th>
              <th style={{ minWidth: '110px' }}>Amount</th>
              <th style={{ minWidth: '110px' }}>Status</th>
              <th style={{ textAlign: 'right', minWidth: '110px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((b) => {
                const svc = services.find((s) => s.id === b.service_id);
                const cust = customers.find((c) => c.id === b.customer_id);
                const pro = professionals.find((p) => p.id === b.professional_id);

                return (
                  <tr key={b.id}>
                    <td>
                      <div className="cell-strong" style={{ color: 'var(--teal)', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{b.booking_number}</span>
                        {b.booking_type === 'urgent' && (
                          <span
                            style={{
                              padding: '1px 6px',
                              borderRadius: '10px',
                              backgroundColor: '#FEF3C7',
                              color: '#D97706',
                              fontSize: '10px',
                              fontWeight: 700,
                              border: '1px solid #FDE68A',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            <Zap size={10} /> URGENT
                          </span>
                        )}
                      </div>
                      <div className="cell-muted" style={{ fontSize: '11.5px', marginTop: '2px' }}>
                        {new Date(b.scheduled_at).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>

                    <td>
                      <div className="cell-strong">{getDisplayName(cust)}</div>
                      <div className="cell-muted" style={{ fontSize: '11.5px' }}>
                        {cust?.phone} · <b>{b.taluka}</b>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '600' }}>
                        {svc?.icon} {svc?.name}
                      </div>
                      <div className="cell-muted" style={{ fontSize: '11.5px' }}>
                        {b.tree_count} {svc?.unit.replace('per ', '')}s
                        {b.height_category ? ` · Height: ${b.height_category}` : ''}
                      </div>
                    </td>

                    <td>
                      {pro ? (
                        <div>
                          <div className="cell-strong" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {pro.avatar_url && (
                              <img
                                src={pro.avatar_url}
                                alt={getDisplayName(pro)}
                                style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            )}
                            <span>{getDisplayName(pro)}</span>
                          </div>
                          <div className="cell-muted" style={{ fontSize: '11.5px' }}>
                            ★ {pro.rating_avg} · {pro.taluka}
                          </div>
                        </div>
                      ) : (
                        <span
                          style={{
                            display: 'inline-block',
                            background: 'rgba(199, 112, 42, 0.1)',
                            color: 'var(--amber)',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '11px'
                          }}
                        >
                          ⚠️ Unassigned
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: '700', fontSize: '13.5px' }}>
                        ₹{Number(b.actual_amount || b.quote_amount).toFixed(2)}
                      </div>
                      {b.surcharge_amount > 0 && (
                        <div style={{ fontSize: '10px', color: '#D97706', fontWeight: 600 }}>
                          (incl. ₹{Number(b.surcharge_amount).toFixed(0)} GST)
                        </div>
                      )}
                      <div style={{ fontSize: '11px', textTransform: 'capitalize', color: b.payment_status === 'paid' ? 'var(--success)' : 'var(--ink-soft)' }}>
                        {b.payment_status === 'paid' ? '● Paid' : '○ Pending'}
                      </div>
                    </td>

                    <td>
                      {b.booking_type === 'urgent' && !b.call_confirmed && b.status === 'requested' ? (
                        <span className="badge gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <PhoneCall size={11} /> Call Pending
                        </span>
                      ) : (
                        <StatusBadge status={b.status} />
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {b.status === 'requested' ? (
                        b.booking_type === 'urgent' && !b.call_confirmed ? (
                          <Button
                            variant="gold"
                            size="sm"
                            icon={PhoneCall}
                            onClick={() => confirmBookingCall(b.id)}
                            title="Call customer to verify and confirm urgent request"
                          >
                            Confirm via Call
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={UserPlus}
                            onClick={() => setAssigningBooking(b)}
                          >
                            Assign Pro
                          </Button>
                        )
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAssigningBooking(b)}
                        >
                          Reassign
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                  <span className="cell-muted">No bookings match the search criteria.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Professional Modal */}
      <AssignWorkerModal
        isOpen={!!assigningBooking}
        onClose={() => setAssigningBooking(null)}
        booking={assigningBooking}
        professionals={professionals}
        services={services}
        onAssign={assignBooking}
      />
    </div>
  );
};
