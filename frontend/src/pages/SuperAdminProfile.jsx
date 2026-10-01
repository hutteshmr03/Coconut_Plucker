import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import {
  ShieldAlert,
  Shield,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Save,
  Camera,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { compressImageFile } from '../utils/helpers';

export const SuperAdminProfile = () => {
  const { currentUser, role, updateCurrentUser, changeAccountPassword, changeSuperAdminPassword } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  // Profile fields
  const [fullName, setFullName] = useState(currentUser?.full_name || 'Chief Platform Administrator');
  const [phone, setPhone] = useState(currentUser?.phone || '9999900000');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Status feedback
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const isSuperAdmin = role === 'super_admin';
  const isForceReset = isSuperAdmin && currentUser?.must_reset_password === true;

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 400, 400, 0.75);
        setAvatarUrl(compressed);
      } catch (err) {
        console.error('Image compression failed:', err);
        setProfileError('Could not process selected image. Please try a different photo.');
      }
    }
  };

  const handleRemovePhoto = (e) => {
    e.preventDefault();
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullName.trim()) {
      setProfileError('Please enter full name.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setProfileError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedData = {
        full_name: fullName.trim(),
        phone: cleanPhone,
        avatar_url: avatarUrl || null
      };

      updateCurrentUser(updatedData);
      setProfileSuccess('Super Admin profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current / temporary password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const fn = changeAccountPassword || changeSuperAdminPassword;
      fn(currentPassword, newPassword);
      setPasswordSuccess('Super Admin password successfully updated! Please use your new password for all future logins.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'SA';

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Forced Password Reset Notice */}
      {isForceReset && (
        <div
          style={{
            background: 'rgba(217, 119, 6, 0.1)',
            border: '2px solid rgba(217, 119, 6, 0.4)',
            borderRadius: 'var(--radius)',
            padding: '16px 20px',
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
          </div>
        </div>
      )}

      {/* Super Admin Account Details Card */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Super Admin Account</h3>
          </div>
          <span
            className="badge"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              background: 'rgba(124, 58, 237, 0.12)',
              color: '#7C3AED',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              borderRadius: '6px',
              fontWeight: '600'
            }}
          >
            <Shield size={12} />
            Super Admin · Active
          </span>
        </div>

        {profileError && (
          <div
            className="field-error"
            style={{
              padding: '10px 14px',
              background: 'rgba(179, 64, 44, 0.08)',
              borderRadius: '8px',
              border: '1px solid rgba(179, 64, 44, 0.2)',
              marginBottom: '16px',
              fontSize: '13px'
            }}
          >
            {profileError}
          </div>
        )}

        {profileSuccess && (
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
            {profileSuccess}
          </div>
        )}

        <form onSubmit={handleProfileSave}>
          {/* Avatar & Photo Upload */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '22px',
              padding: '14px',
              background: 'var(--parchment)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--sand)'
            }}
          >
            <div style={{ position: 'relative' }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #7C3AED'
                  }}
                />
              ) : (
                <div
                  className="worker-avatar"
                  style={{
                    width: '68px',
                    height: '68px',
                    fontSize: '22px',
                    backgroundColor: '#1E1B4B',
                    color: 'var(--gold)',
                    fontWeight: '700'
                  }}
                >
                  {initials}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>
                Profile Photo
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Camera}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Photo
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={handleRemovePhoto}
                    style={{ color: 'var(--danger)' }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Input
            label="Super Admin Full Name"
            placeholder="e.g. Chief Platform Administrator"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Mobile Phone (for Login)"
            type="tel"
            placeholder="e.g. 9999900000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Change Password Form */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <KeyRound size={20} color="var(--teal)" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
            Reset Super Admin Password
          </h3>
        </div>

        {passwordError && (
          <div
            className="field-error"
            style={{
              padding: '10px 14px',
              background: 'rgba(179, 64, 44, 0.08)',
              borderRadius: '8px',
              border: '1px solid rgba(179, 64, 44, 0.2)',
              marginBottom: '16px',
              fontSize: '13px'
            }}
          >
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
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
            {passwordSuccess}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <Input
            label="Current / Temporary Password"
            type="password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <div className="field-row">
            <Input
              label="New Password"
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="outline"
              icon={Lock}
              disabled={isSavingPassword}
            >
              {isSavingPassword ? 'Updating Password...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
