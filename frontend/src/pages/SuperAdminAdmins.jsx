import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDisplayName } from '../utils/helpers';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import {
  UserPlus,
  ShieldAlert,
  Search,
  CheckCircle2,
  Trash2,
  Power,
  Lock,
  UserCheck
} from 'lucide-react';

const TALUKAS = [
  { value: 'All Talukas', label: 'All Talukas (Goa-wide)' },
  { value: 'North Goa', label: 'North Goa' },
  { value: 'South Goa', label: 'South Goa' },
  { value: 'Kushavati', label: 'Kushavati' }
];

export const SuperAdminAdmins = () => {
  const { adminAccounts, createAdminAccount, toggleAdminStatus, deleteAdminAccount } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deactivatingAdmin, setDeactivatingAdmin] = useState(null);
  const [deletingAdmin, setDeletingAdmin] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Create Admin form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [taluka, setTaluka] = useState('All Talukas');
  const [password, setPassword] = useState('admin123');

  const filteredAdmins = adminAccounts.filter((admin) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (admin.full_name && admin.full_name.toLowerCase().includes(q)) ||
      (admin.phone && admin.phone.includes(q)) ||
      (admin.email && admin.email.toLowerCase().includes(q)) ||
      (admin.taluka && admin.taluka.toLowerCase().includes(q))
    );
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      if (!name.trim()) throw new Error('Please enter admin full name.');
      if (!phone || phone.replace(/\D/g, '').length < 10) throw new Error('Please enter a valid 10-digit mobile number.');

      createAdminAccount({
        full_name: name.trim(),
        phone: phone.replace(/\D/g, ''),
        email: email.trim() || undefined,
        taluka,
        password: password.trim() || 'admin123'
      });

      setSuccessMessage(`Admin account for "${name}" created successfully!`);
      setTimeout(() => setSuccessMessage(''), 4000);

      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setTaluka('All Talukas');
      setPassword('admin123');
      setIsCreateModalOpen(false);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create admin account.');
    }
  };

  const handleConfirmToggle = () => {
    if (!deactivatingAdmin) return;
    try {
      toggleAdminStatus(deactivatingAdmin.id);
      setSuccessMessage(`Admin "${getDisplayName(deactivatingAdmin)}" status updated.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      setDeactivatingAdmin(null);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingAdmin) return;
    try {
      deleteAdminAccount(deletingAdmin.id);
      setSuccessMessage(`Admin account "${getDisplayName(deletingAdmin)}" removed.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      setDeletingAdmin(null);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div>
      {/* Top Banner Alert */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.1), rgba(14, 42, 63, 0.05))',
          border: '1px solid rgba(88, 28, 135, 0.25)',
          borderRadius: 'var(--radius)',
          padding: '16px 20px',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px'
        }}
      >
        <div>
          <b style={{ color: 'var(--ink)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} color="#7C3AED" />
            Super Admin Authority: Administrator Account Provisioning
          </b>
          <p style={{ color: 'var(--ink-soft)', fontSize: '12.5px', marginTop: '3px', margin: 0 }}>
            Super Admin is the sole role authorized to create, configure, and deactivate Admin accounts. Standard Admins cannot provision other Admins.
          </p>
        </div>
        <Button
          variant="gold"
          icon={UserPlus}
          onClick={() => {
            setErrorMessage('');
            setIsCreateModalOpen(true);
          }}
        >
          Create New Admin
        </Button>
      </div>

      {successMessage && (
        <div
          style={{
            background: 'rgba(47, 122, 77, 0.12)',
            color: 'var(--success)',
            border: '1px solid rgba(47, 122, 77, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} />
          {successMessage}
        </div>
      )}

      {/* Toolbar & Search */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} color="var(--ink-soft)" />
          <input
            type="text"
            placeholder="Search admins by name, phone, email, or Taluka..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Admins Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Admin Name & User ID</th>
              <th>Contact Phone</th>
              <th>Assigned Region / Taluka</th>
              <th>Date Provisioned</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.length > 0 ? (
              filteredAdmins.map((admin) => (
                <tr key={admin.id}>
                  <td>
                    <div className="cell-strong">{getDisplayName(admin)}</div>
                    <div className="cell-muted" style={{ fontSize: '11.5px' }}>
                      @{admin.username} {admin.email ? `· ${admin.email}` : ''}
                    </div>
                  </td>
                  <td>
                    <span className="cell-strong">+91 {admin.phone}</span>
                  </td>
                  <td>
                    <span className="badge blue">{admin.taluka || 'All Talukas'}</span>
                  </td>
                  <td className="cell-muted">
                    {admin.created_at
                      ? new Date(admin.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : 'Initial Seed'}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        admin.status === 'active' ? 'green' : 'gray'
                      }`}
                    >
                      {admin.status === 'active' ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className={`icon-btn ${admin.status === 'active' ? 'del' : ''}`}
                        title={admin.status === 'active' ? 'Deactivate Admin' : 'Activate Admin'}
                        onClick={() => setDeactivatingAdmin(admin)}
                      >
                        <Power size={14} />
                      </button>
                      <button
                        className="icon-btn del"
                        title="Delete Admin Account"
                        onClick={() => setDeletingAdmin(admin)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>
                  <span className="cell-muted">No administrator accounts match your search.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Admin */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision New Admin Account"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={UserPlus} onClick={handleCreateSubmit}>
              Create Admin
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit}>
          <p className="cell-muted" style={{ marginBottom: '16px', fontSize: '13px' }}>
            Provision an administrator credential with access to platform workforce, booking verification, and safety operations.
          </p>

          {errorMessage && (
            <div className="field-error" style={{ marginBottom: '14px', padding: '8px 12px', background: 'rgba(179, 64, 44, 0.08)', borderRadius: '6px' }}>
              {errorMessage}
            </div>
          )}

          <Input
            label="Admin Full Name"
            placeholder="e.g. Suresh Naik"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="field-row">
            <Input
              label="Mobile Phone (for Login)"
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              hint="Admin signs in using phone or User ID"
            />
            <Select
              label="Regional Scope / Taluka"
              value={taluka}
              onChange={(e) => setTaluka(e.target.value)}
              options={TALUKAS}
              required
            />
          </div>

          <div className="field-row">
            <Input
              label="Admin Email (Optional)"
              type="email"
              placeholder="e.g. snaik@coconutplucker.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Initial Password"
              type="password"
              placeholder="Temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              hint="Default: admin123"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmation for Deactivation / Status Toggle */}
      <Modal
        isOpen={!!deactivatingAdmin}
        onClose={() => setDeactivatingAdmin(null)}
        title={deactivatingAdmin?.status === 'active' ? 'Deactivate Admin Account?' : 'Reactivate Admin Account?'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeactivatingAdmin(null)}>
              Cancel
            </Button>
            <Button
              variant={deactivatingAdmin?.status === 'active' ? 'danger' : 'primary'}
              onClick={handleConfirmToggle}
            >
              {deactivatingAdmin?.status === 'active' ? 'Yes, Deactivate' : 'Yes, Reactivate'}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '13.5px', color: 'var(--ink)' }}>
          Are you sure you want to {deactivatingAdmin?.status === 'active' ? 'deactivate' : 'reactivate'} the administrator account for <b>{getDisplayName(deactivatingAdmin)}</b> (+91 {deactivatingAdmin?.phone})?
        </p>
        <p className="cell-muted" style={{ marginTop: '10px', fontSize: '12px' }}>
          Deactivated admins will be immediately blocked from signing in to the operations dashboard. Existing booking assignment history will be preserved.
        </p>
      </Modal>

      {/* Modal: Confirmation for Hard Delete */}
      <Modal
        isOpen={!!deletingAdmin}
        onClose={() => setDeletingAdmin(null)}
        title="Delete Admin Account Permanently?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingAdmin(null)}>
              Cancel
            </Button>
            <Button variant="danger" icon={Trash2} onClick={handleConfirmDelete}>
              Delete Permanently
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '13.5px', color: 'var(--ink)' }}>
          Are you sure you want to permanently delete <b>{getDisplayName(deletingAdmin)}</b>'s administrator account?
        </p>
        <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--danger)', fontWeight: '600' }}>
          ⚠️ This action cannot be undone. For active platforms, deactivating the account is recommended to maintain audit history.
        </p>
      </Modal>
    </div>
  );
};
