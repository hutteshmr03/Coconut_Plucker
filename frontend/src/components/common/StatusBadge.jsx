import React from 'react';

export const StatusBadge = ({ status }) => {
  const map = {
    requested: { cls: 'gray', label: 'Requested' },
    assigned: { cls: 'gold', label: 'Assigned' },
    in_progress: { cls: 'amber', label: 'In Progress' },
    completed: { cls: 'green', label: 'Completed' },
    cancelled: { cls: 'red', label: 'Cancelled' },
    paid: { cls: 'green', label: 'Paid' },
    pending: { cls: 'gold', label: 'Pending' },
    approved: { cls: 'green', label: 'Approved' },
    pending_verification: { cls: 'amber', label: 'Verification Pending' },
    rejected: { cls: 'red', label: 'Rejected' },
    active: { cls: 'green', label: 'Active' },
    inactive: { cls: 'gray', label: 'Inactive' },
    resolved: { cls: 'green', label: 'Resolved' },
    open: { cls: 'amber', label: 'Open' }
  };

  const current = map[status] || { cls: 'gray', label: status };

  return <span className={`badge ${current.cls}`}>{current.label}</span>;
};
