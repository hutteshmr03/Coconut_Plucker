import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { Save, Camera, Trash2, Upload } from 'lucide-react';

const TALUKAS = [
  { value: 'North Goa', label: 'North Goa' },
  { value: 'South Goa', label: 'South Goa' },
  { value: 'Kushavati', label: 'Kushavati' }
];

export const CustomerProfile = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const { updateCustomerProfile } = useApp();
  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [taluka, setTaluka] = useState(currentUser?.taluka || 'North Goa');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Please choose an image under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (e) => {
    e.preventDefault();
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const updatedData = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      taluka,
      avatar_url: avatarUrl || null
    };

    updateCurrentUser(updatedData);
    updateCustomerProfile(updatedData);
  };

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      <Card>
        <h3>Customer Account Profile</h3>
        <p className="cell-muted" style={{ marginBottom: '20px' }}>
          Your profile photo and details are used for scheduling and verified communication.
        </p>

        {/* Profile Photo Upload Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '16px',
            background: 'var(--cream)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            marginBottom: '24px'
          }}
        >
          <div style={{ position: 'relative' }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || 'Profile'}
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--teal)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: 'var(--gold)',
                  color: 'var(--navy-deep)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: '700',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                {initials}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--teal)',
                color: '#FFFFFF',
                border: '2px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
              title="Upload Profile Picture"
            >
              <Camera size={13} />
            </button>
          </div>

          <div style={{ flex: 1 }}>
            <b style={{ display: 'block', fontSize: '14px', color: 'var(--ink)' }}>
              Profile Photo
            </b>
            <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: '2px 0 10px' }}>
              Upload your photo (JPG, PNG or WebP, up to 5MB).
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUrl ? 'Change Photo' : 'Upload Photo'}
              </Button>

              {avatarUrl && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={handleRemovePhoto}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="field-row">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <Select
            label="Taluka (Region)"
            value={taluka}
            onChange={(e) => setTaluka(e.target.value)}
            options={TALUKAS}
            required
          />

          <Input
            label="Primary Property Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button variant="primary" icon={Save} type="submit">
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
