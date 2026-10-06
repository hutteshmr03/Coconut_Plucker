import React, { useState } from 'react';
import { Search, Clock } from 'lucide-react';

const INITIAL_AUDIT_LOGS = [
  {
    id: 'log_001',
    actor: 'Platform Administrator (admin)',
    action: 'Verified Professional Profile',
    target: 'Ramesh Prabhu (wrk_001)',
    timestamp: '2026-09-24T10:30:00Z',
    details: 'Status changed from pending_verification to approved. Skills: 4 services.'
  },
  {
    id: 'log_002',
    actor: 'Platform Administrator (admin)',
    action: 'Assigned Climber to Booking',
    target: 'Booking #BK-2609-001',
    timestamp: '2026-09-24T11:15:00Z',
    details: 'Assigned to Suresh Naik (wrk_002) in North Goa.'
  },
  {
    id: 'log_003',
    actor: 'Chief Platform Administrator (superadmin)',
    action: 'Provisioned New Admin Account',
    target: 'Suresh Naik (usr_adm_002)',
    timestamp: '2026-09-25T09:00:00Z',
    details: 'Role: Admin. Regional Scope: South Goa & Kushavati.'
  },
  {
    id: 'log_004',
    actor: 'Platform Administrator (admin)',
    action: 'Updated Service Base Rate',
    target: 'Canopy / Tree Trimming (svc_trim)',
    timestamp: '2026-09-25T10:00:00Z',
    details: 'Base rate configured to ₹150.00 / per tree. Requires height category.'
  },
  {
    id: 'log_005',
    actor: 'Platform Administrator (admin)',
    action: 'Confirmed Urgent Call',
    target: 'Booking #BK-2609-004',
    timestamp: '2026-09-25T11:45:00Z',
    details: 'Urgent phone confirmation call recorded. Customer confirmed dispatch.'
  }
];

const getActionBadgeColor = (action = '') => {
  const a = action.toLowerCase();
  if (a.includes('verified') || a.includes('approved') || a.includes('confirmed')) return 'green';
  if (a.includes('provisioned') || a.includes('admin')) return 'purple';
  if (a.includes('rate') || a.includes('price') || a.includes('service')) return 'gold';
  if (a.includes('delete') || a.includes('deactivate')) return 'red';
  return 'blue';
};

export const SuperAdminAudit = () => {
  const [search, setSearch] = useState('');

  const filteredLogs = INITIAL_AUDIT_LOGS.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.target.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3>Platform-Wide Operations Audit Trail</h3>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} color="var(--ink-soft)" />
          <input
            type="text"
            placeholder="Search audit trail by administrator, action type, or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop Audit Table */}
      <div className="desktop-audit-table table-wrap">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Administrator / Actor</th>
              <th>Action Event</th>
              <th>Target Object</th>
              <th>Event Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td className="cell-muted" style={{ whiteSpace: 'nowrap' }}>
                  {new Date(log.timestamp).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td>
                  <div className="cell-strong" style={{ color: 'var(--navy-mid)' }}>
                    {log.actor}
                  </div>
                </td>
                <td>
                  <span className={`badge ${getActionBadgeColor(log.action)}`}>{log.action}</span>
                </td>
                <td className="cell-strong">{log.target}</td>
                <td className="cell-muted" style={{ maxWidth: '320px' }}>
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Audit Cards (Zero Horizontal Scrolling) */}
      <div className="mobile-audit-cards">
        {filteredLogs.map((log) => (
          <div key={log.id} className="audit-mobile-card">
            {/* Header: Action Badge + Formatted Time */}
            <div className="audit-card-header">
              <span className={`badge ${getActionBadgeColor(log.action)}`}>
                {log.action}
              </span>
              <span className="audit-timestamp">
                <Clock size={12} />
                <span>
                  {new Date(log.timestamp).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </span>
            </div>

            {/* Actor & Target */}
            <div className="audit-card-body">
              <div className="audit-meta-row">
                <span className="audit-meta-lbl">Actor:</span>
                <span className="audit-meta-actor">{log.actor}</span>
              </div>
              <div className="audit-meta-row">
                <span className="audit-meta-lbl">Target:</span>
                <span className="audit-meta-target">{log.target}</span>
              </div>
            </div>

            {/* Details Box */}
            <div className="audit-details-box">
              <div className="audit-details-text">{log.details}</div>
            </div>
          </div>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink-soft)' }}>
          No audit records found matching your search.
        </div>
      )}
    </div>
  );
};

