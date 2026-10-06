import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { IncidentLogModal } from '../components/admin/IncidentLogModal';
import { ShieldCheck, AlertTriangle, Plus, CheckCircle } from 'lucide-react';

export const AdminSafety = () => {
  const { incidents, professionals, bookings, addIncident, resolveIncident } = useApp();

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  return (
    <div>
      {/* Top Stat Banner */}
      <div className="stat-grid">
        <div className="stat-card" style={{ '--accent': 'var(--leaf)' }}>
          <div className="stat-label">Safety Compliance</div>
          <div className="stat-value">100%</div>
          <div className="stat-foot up">pre-climb checklists verified</div>
        </div>

        <div className="stat-card" style={{ '--accent': 'var(--amber)' }}>
          <div className="stat-label">Open Safety Action Items</div>
          <div className="stat-value">{incidents.filter((i) => i.status === 'open').length}</div>
          <div className="stat-foot warn">requires operational review</div>
        </div>

        <div className="stat-card" style={{ '--accent': 'var(--teal)' }}>
          <div className="stat-label">Resolved Audits</div>
          <div className="stat-value">{incidents.filter((i) => i.status === 'resolved').length}</div>
          <div className="stat-foot">gear swaps & near-miss logs</div>
        </div>

        <div className="stat-card" style={{ '--accent': 'var(--gold)' }}>
          <div className="stat-label">Zero Injury Days</div>
          <div className="stat-value">184</div>
          <div className="stat-foot up">consecutive safe climbs</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3>Safety Incidents</h3>
        </div>
        <Button variant="danger" icon={Plus} onClick={() => setIsLogModalOpen(true)}>
          Log Safety Incident
        </Button>
      </div>

      {/* Incidents Table (Desktop View) */}
      <div className="desktop-safety-table table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Reported By</th>
              <th>Classification</th>
              <th>Severity</th>
              <th>Description & Corrective Action</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc) => (
              <tr key={inc.id}>
                <td className="cell-muted">
                  {new Date(inc.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
                <td className="cell-strong">{inc.reported_by_name}</td>
                <td>{inc.type}</td>
                <td>
                  <span
                    className={`badge ${
                      inc.severity === 'high' ? 'red' : inc.severity === 'medium' ? 'amber' : 'gray'
                    }`}
                  >
                    {inc.severity}
                  </span>
                </td>
                <td className="cell-muted" style={{ maxWidth: '350px' }}>
                  {inc.description}
                </td>
                <td>
                  <StatusBadge status={inc.status} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  {inc.status === 'open' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle}
                      onClick={() => resolveIncident(inc.id)}
                    >
                      Mark Resolved
                    </Button>
                  ) : (
                    <span className="cell-muted" style={{ fontSize: '12px' }}>
                      Audit Closed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Incidents Cards (Mobile View - Zero Horizontal Scrolling) */}
      <div className="mobile-safety-cards">
        {incidents.map((inc) => (
          <div key={inc.id} className="safety-mobile-card">
            {/* Header: Date + Classification & Severity */}
            <div className="safety-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="cell-strong" style={{ fontSize: '14px' }}>
                  {inc.type}
                </span>
                <span
                  className={`badge ${
                    inc.severity === 'high' ? 'red' : inc.severity === 'medium' ? 'amber' : 'gray'
                  }`}
                >
                  {inc.severity}
                </span>
              </div>
              <span className="cell-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                {new Date(inc.created_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>

            {/* Reporter Info */}
            <div className="safety-card-reporter">
              <span className="cell-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
                Reported by:
              </span>
              <span className="cell-strong" style={{ color: 'var(--ink)' }}>
                {inc.reported_by_name}
              </span>
            </div>

            {/* Description & Action */}
            <div className="safety-card-desc">
              {inc.description}
            </div>

            {/* Footer: Status + Resolve action */}
            <div className="safety-card-footer">
              <div>
                <StatusBadge status={inc.status} />
              </div>
              <div>
                {inc.status === 'open' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle}
                    onClick={() => resolveIncident(inc.id)}
                  >
                    Mark Resolved
                  </Button>
                ) : (
                  <span className="cell-muted" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={13} color="var(--leaf)" />
                    <span>Audit Closed</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Log Modal */}
      <IncidentLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onLog={addIncident}
        professionals={professionals}
        bookings={bookings}
      />
    </div>
  );
};
