import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getDisplayName } from '../utils/helpers';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { AssignWorkerModal } from '../components/admin/AssignWorkerModal';
import { Search, UserPlus, PhoneCall, Phone, Check, Zap, Camera, Eye } from 'lucide-react';

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
  const [previewPhotoBooking, setPreviewPhotoBooking] = useState(null);

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

      {/* Desktop Bookings Table */}
      <div className="table-wrap desktop-booking-table">
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
                      <div className="cell-muted" style={{ fontSize: '11.5px', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {cust?.phone ? (
                          <a
                            href={`tel:${String(cust.phone).replace(/[^0-9+]/g, '')}`}
                            className="phone-link-pill"
                            title={`Click to call ${getDisplayName(cust)} (${cust.phone})`}
                          >
                            <Phone size={10} />
                            <span>{cust.phone}</span>
                          </a>
                        ) : '—'}
                        <span>· <b>{b.taluka}</b></span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '600' }}>
                        {svc?.icon} {svc?.name}
                      </div>
                      <div className="cell-muted" style={{ fontSize: '11.5px' }}>
                        {b.tree_count} {svc?.unit?.replace('per ', '') || 'tree'}s
                        {b.height_category ? ` · Height: ${b.height_category}` : ''}
                      </div>
                      {b.tree_photo && (
                        <div style={{ marginTop: '4px' }}>
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoBooking(b)}
                            style={{
                              background: 'rgba(31, 138, 130, 0.08)',
                              border: '1px solid var(--teal)',
                              color: 'var(--teal-dark)',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Camera size={11} /> View Snap
                          </button>
                        </div>
                      )}
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
                            {pro.taluka}
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
                            onClick={() => {
                              const rawPhone = cust?.phone || b.customer_phone || b.phone || '';
                              const cleanPhone = String(rawPhone).replace(/[^0-9+]/g, '');
                              if (cleanPhone) {
                                window.location.href = `tel:${cleanPhone}`;
                              }
                              confirmBookingCall(b.id, cust);
                            }}
                            title={`Call customer (${cust?.phone || 'Customer'}) to verify and confirm urgent request`}
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

      {/* Mobile Bookings Dispatch Cards (Zero Horizontal Scrolling) */}
      <div className="mobile-booking-cards">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((b) => {
            const svc = services.find((s) => s.id === b.service_id);
            const cust = customers.find((c) => c.id === b.customer_id);
            const pro = professionals.find((p) => p.id === b.professional_id);
            const isCallPending = b.booking_type === 'urgent' && !b.call_confirmed && b.status === 'requested';

            return (
              <div key={b.id} className="booking-dispatch-card">
                {/* Header: Booking #, Date, Status */}
                <div className="bd-card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <b style={{ color: 'var(--teal)', fontSize: '14px' }}>{b.booking_number}</b>
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
                      📅 {new Date(b.scheduled_at).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  <div>
                    {isCallPending ? (
                      <span className="badge gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <PhoneCall size={11} /> Call Needed
                      </span>
                    ) : (
                      <StatusBadge status={b.status} />
                    )}
                  </div>
                </div>

                {/* Body Details */}
                <div className="bd-card-body">
                  {/* Service & Qty */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>
                      {svc?.icon} {svc?.name} · {b.tree_count} {svc?.unit?.replace('per ', '') || 'tree'}s
                      {b.height_category ? ` (${b.height_category})` : ''}
                    </div>
                    {b.tree_photo && (
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoBooking(b)}
                        style={{
                          background: 'rgba(31, 138, 130, 0.08)',
                          border: '1px solid var(--teal)',
                          color: 'var(--teal-dark)',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Camera size={11} /> Snap
                      </button>
                    )}
                  </div>

                  {/* Customer & Location */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ fontSize: '12.5px' }}>
                      <span className="cell-muted">Customer: </span>
                      <b>{getDisplayName(cust)}</b>
                    </div>
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
                  </div>

                  {/* 2-Column Info Grid */}
                  <div className="bd-meta-grid">
                    <div className="bd-meta-item">
                      <span className="bd-meta-lbl">Taluka / Region</span>
                      <b className="bd-meta-val">{b.taluka}</b>
                    </div>

                    <div className="bd-meta-item">
                      <span className="bd-meta-lbl">Assigned Climber</span>
                      {pro ? (
                        <span className="bd-meta-val" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {pro.avatar_url && (
                            <img
                              src={pro.avatar_url}
                              alt={getDisplayName(pro)}
                              style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          )}
                          {getDisplayName(pro)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--amber)', fontSize: '11.5px', fontWeight: '700' }}>
                          ⚠️ Unassigned
                        </span>
                      )}
                    </div>

                    <div className="bd-meta-item">
                      <span className="bd-meta-lbl">Amount</span>
                      <b className="bd-meta-val" style={{ color: 'var(--teal)', fontSize: '13px' }}>
                        ₹{Number(b.actual_amount || b.quote_amount).toFixed(2)}
                      </b>
                    </div>

                    <div className="bd-meta-item">
                      <span className="bd-meta-lbl">Payment Status</span>
                      <span className="bd-meta-val" style={{ color: b.payment_status === 'paid' ? 'var(--success)' : 'var(--amber)', fontWeight: '600' }}>
                        {b.payment_status === 'paid' ? '● Paid' : '○ Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="bd-card-footer">
                  {b.status === 'requested' ? (
                    isCallPending ? (
                      <Button
                        variant="gold"
                        size="sm"
                        icon={PhoneCall}
                        className="btn-block"
                        onClick={() => {
                          const rawPhone = cust?.phone || b.customer_phone || b.phone || '';
                          const cleanPhone = String(rawPhone).replace(/[^0-9+]/g, '');
                          if (cleanPhone) {
                            window.location.href = `tel:${cleanPhone}`;
                          }
                          confirmBookingCall(b.id, cust);
                        }}
                      >
                        Confirm via Call
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={UserPlus}
                        className="btn-block"
                        onClick={() => setAssigningBooking(b)}
                      >
                        Assign Pro
                      </Button>
                    )
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="btn-block"
                      onClick={() => setAssigningBooking(b)}
                    >
                      Reassign Climber
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink-soft)' }}>
            No bookings match the search criteria.
          </div>
        )}
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

      {/* Tree Snapshot Lightbox Modal for Admin */}
      {previewPhotoBooking && (
        <Modal
          isOpen={!!previewPhotoBooking}
          onClose={() => setPreviewPhotoBooking(null)}
          title={`Tree Photo · ${previewPhotoBooking.booking_number}`}
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={previewPhotoBooking.tree_photo}
              alt="Customer tree photo"
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
              }}
            />
            <div style={{ marginTop: '14px', fontSize: '13px', color: 'var(--ink)' }}>
              Location: <b>{previewPhotoBooking.address}, {previewPhotoBooking.taluka}</b>
              {previewPhotoBooking.height_category && (
                <div>Height Category: <b style={{ color: 'var(--amber)' }}>{previewPhotoBooking.height_category} altitude</b></div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
