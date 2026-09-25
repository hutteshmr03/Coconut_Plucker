import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import {
  ShieldAlert,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';

export const SuperAdminProfile = () => {
  const { currentUser, changeSuperAdminPassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isForceReset = currentUser?.must_reset_password === true;

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Please enter your current / temporary password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from the current password.');
      return;
    }

    setIsSubmitting(true);
    try {
      changeSuperAdminPassword(currentPassword, newPassword);
      setSuccess('Super Admin password successfully updated! Platform access is now fully verified.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Forced Password Reset Notice */}
      {isForceReset && (
        <div
          style={{
            background: 'rgba(217, 119, 6, 0.1)',
            border: '2px solid rgba(217, 119, 6, 0.4)',
            borderRadius: 'var(--radius)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <AlertTriangle size={22} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <b style={{ color: '#92400E', fontSize: '14px', display: 'block' }}>
              Action Required: Change Temporary Super Admin Password
            </b>
            <p style={{ color: '#78350F', fontSize: '12.5px', marginTop: '4px', lineHeight: '1.5', margin: 0 }}>
              This Super Admin account was provisioned with an initial temporary seed password. You must set a permanent secure password below to unlock all platform operations.
            </p>
          </div>
        </div>
      )}

      {/* Change Password Form */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <KeyRound size={20} color="var(--teal)" />
          <h3 style={{ margin: 0 }}>Reset Super Admin Password</h3>
        </div>

        <p className="cell-muted" style={{ marginBottom: '20px', fontSize: '13px' }}>
          Update your login password. Current password confirmation is required.
        </p>

        {error && (
          <div
            className="field-error"
            style={{
              padding: '10px 14px',
              background: 'rgba(179, 64, 44, 0.08)',
              borderRadius: '8px',
              border: '1px solid rgba(179, 64, 44, 0.2)',
              marginBottom: '16px',
              fontSize: '12.5px'
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(47, 122, 77, 0.12)',
              color: 'var(--success)',
              borderRadius: '8px',
              border: '1px solid rgba(47, 122, 77, 0.3)',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} />
            {success}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          {/* Current Password */}
          <div className="field">
            <label>Current / Temporary Password *</label>
            <div className="password-input-wrapper" style={{ position: 'relative' }}>
              <input
                type={showCurrentPass ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{ width: '100%', paddingRight: '42px' }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink-soft)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {isForceReset && (
              <div className="field-hint">Initial seed password: <code>tempPassword123!</code></div>
            )}
          </div>

          {/* New Password */}
          <div className="field">
            <label>New Password (Min 6 characters) *</label>
            <div className="password-input-wrapper" style={{ position: 'relative' }}>
              <input
                type={showNewPass ? 'text' : 'password'}
                placeholder="Enter new strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ width: '100%', paddingRight: '42px' }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowNewPass(!showNewPass)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink-soft)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="field">
            <label>Confirm New Password *</label>
            <div className="password-input-wrapper" style={{ position: 'relative' }}>
              <input
                type={showConfirmPass ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: '100%', paddingRight: '42px' }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink-soft)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button
              variant="primary"
              size="lg"
              type="submit"
              icon={Save}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Save & Confirm Password'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
