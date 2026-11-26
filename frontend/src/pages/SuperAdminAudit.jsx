import React, { useState, useEffect } from 'react';
import { Search, Clock } from 'lucide-react';
import { superAdminAPI } from '../services/api';

const INITIAL_AUDIT_LOGS = [
  {
    id: 'log_001',
    actor: 'Platform Administrator',
    action: 'Verified Professional Profile',
    target: 'Ramesh Prabhu (wrk_001)',
    timestamp: '2026-09-24T10:30:00Z',
    details: 'Status changed from pending_verification to approved. Skills: 4 services.'
  },
  {
    id: 'log_002',
    actor: 'Platform Administrator',
    action: 'Assigned Climber to Booking',
    target: 'Booking #BK-2609-001',
    timestamp: '2026-09-24T11:15:00Z',
    details: 'Assigned to Suresh Naik (wrk_002) in North Goa.'
  },
  {
    id: 'log_003',
    actor: 'Chief Platform Admin',
    action: 'Provisioned New Admin Account',
    target: 'Suresh Naik (usr_adm_002)',
    timestamp: '2026-09-25T09:00:00Z',
    details: 'Role: Admin. Regional Scope: South Goa & Kushavati.'
  },
  {
    id: 'log_004',
    actor: 'Platform Administrator',
    action: 'Updated Service Base Rate',
    target: 'Canopy / Tree Trimming (svc_trim)',
    timestamp: '2026-09-25T10:00:00Z',
    details: 'Base rate configured to ₹150.00 / per tree. Requires height category.'
  },
  {
    id: 'log_005',
    actor: 'Platform Administrator',
    action: 'Confirmed Urgent Call',
    target: 'Booking #BK-2609-004',
    timestamp: '2026-09-25T11:45:00Z',
    details: 'Urgent phone confirmation call recorded. Customer confirmed dispatch.'
  }
];

const isAdminAuditLog = (log = {}) => {
  const actor = (log.actor || '').toLowerCase();
  const action = (log.action || '').toLowerCase();
  if (actor.includes('(customer)') || actor.includes('(professional)')) return false;
  if (action.includes('placed customer booking') || action.includes('registered new account')) return false;
  return (
    actor.includes('admin') ||
    action.includes('admin') ||
    action.includes('verified professional') ||
    action.includes('rejected professional') ||
    action.includes('confirmed urgent') ||
    action.includes('assigned climber') ||
    action.includes('service base rate') ||
    action.includes('regional scheduling')
  );
};

const formatAuditActor = (actor = '') =>
  String(actor)
    .replace(/Chief Platform Administrator/gi, 'Chief Platform Admin')
    .replace(/\s*\((super_admin|superadmin|admin)\)\s*$/i, '')
    .trim();

const formatAuditTarget = (target = '') =>
  String(target).replace(/Chief Platform Administrator/gi, 'Chief Platform Admin');

const formatAuditTimestampIST = (rawTs) => {
  if (!rawTs) return { time: '—', date: '' };
  let str = String(rawTs).trim();
  // Ensure naive ISO timestamps from backend DB are parsed as UTC before converting to IST
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(str) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(str)) {
    str = str.replace(' ', 'T') + 'Z';
  }
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return { time: str, date: '' };

  const time = d
    .toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    .toUpperCase();

  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
    .format(d)
    .replace(/\//g, '-');

  return { time, date };
};

const getActionBadgeColor = (action = '') => {
  const a = action.toLowerCase();
  if (a.includes('verified') || a.includes('approved') || a.includes('confirmed') || a.includes('placed')) return 'green';
  if (a.includes('provisioned') || a.includes('logged') || a.includes('registered')) return 'purple';
  if (a.includes('rate') || a.includes('price') || a.includes('service') || a.includes('scheduling') || a.includes('password') || a.includes('status')) return 'gold';
  if (a.includes('delete') || a.includes('deactivate') || a.includes('rejected')) return 'red';
  return 'blue';
};

export const SuperAdminAudit = () => {
  const [search, setSearch] = useState('');
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  useEffect(() => {
    let cancelled = false;
    superAdminAPI
      .getAuditLogs()
      .then((logs) => {
        if (!cancelled && Array.isArray(logs) && logs.length > 0) {
          setAuditLogs(logs);
        }
      })
      .catch((err) => console.warn('[Backend] Audit log fetch fallback:', err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredLogs = auditLogs
    .filter(isAdminAuditLog)
    .filter((log) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        formatAuditActor(log.actor).toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q) ||
        formatAuditTarget(log.target).toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q)
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
            placeholder="Search audit trail by administrator, action, or target..."
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
              <th>Administrator</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => {
              const ts = formatAuditTimestampIST(log.timestamp);
              const actorName = formatAuditActor(log.actor);
              const targetLabel = formatAuditTarget(log.target);
              return (
                <tr key={log.id}>
                  <td className="audit-ts-cell">
                    <div className="audit-ts-time">{ts.time}</div>
                    {ts.date && <div className="audit-ts-date">{ts.date}</div>}
                  </td>
                  <td>
                    <div className="cell-strong" style={{ color: 'var(--navy-mid)' }}>
                      {actorName}
                    </div>
                  </td>
                  <td className="audit-action-cell">
                    <span className={`badge ${getActionBadgeColor(log.action)}`}>{log.action}</span>
                  </td>
                  <td className="cell-strong">{targetLabel}</td>
                  <td className="cell-muted" style={{ maxWidth: '320px' }}>
                    {log.details}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Audit Cards (Zero Horizontal Scrolling) */}
      <div className="mobile-audit-cards">
        {filteredLogs.map((log) => {
          const ts = formatAuditTimestampIST(log.timestamp);
          const actorName = formatAuditActor(log.actor);
          const targetLabel = formatAuditTarget(log.target);
          return (
            <div key={log.id} className="audit-mobile-card">
              {/* Header: Action Badge + Formatted Time */}
              <div className="audit-card-header">
                <span className={`badge ${getActionBadgeColor(log.action)}`}>
                  {log.action}
                </span>
                <span className="audit-timestamp">
                  <Clock size={12} />
                  <span>
                    {ts.time}{ts.date ? `, ${ts.date}` : ''}
                  </span>
                </span>
              </div>

              {/* Administrator & Target */}
              <div className="audit-card-body">
                <div className="audit-meta-row">
                  <span className="audit-meta-lbl">Administrator:</span>
                  <span className="audit-meta-actor">{actorName}</span>
                </div>
                <div className="audit-meta-row">
                  <span className="audit-meta-lbl">Target:</span>
                  <span className="audit-meta-target">{targetLabel}</span>
                </div>
              </div>

              {/* Details Box */}
              <div className="audit-details-box">
                <div className="audit-details-text">{log.details}</div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLogs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink-soft)' }}>
          No audit records found matching your search.
        </div>
      )}
    </div>
  );
};

