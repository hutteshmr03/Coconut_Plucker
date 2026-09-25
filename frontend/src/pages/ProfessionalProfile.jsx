import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { Save, Camera, Trash2, Upload } from 'lucide-react';

const TALUKAS = [
  { value: 'North Goa', label: 'North Goa' },
  { value: 'South Goa', label: 'South Goa' },
  { value: 'Kushavati', label: 'Kushavati' }
];

export const ProfessionalProfile = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const { services, updateProfessionalProfile } = useApp();
  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [experienceYears, setExperienceYears] = useState(
    currentUser?.experience_years || 5
  );
  const [safetyCert, setSafetyCert] = useState(
    currentUser?.safety_cert || ''
  );
  const [taluka, setTaluka] = useState(currentUser?.taluka || 'North Goa');
  const [selectedSkills, setSelectedSkills] = useState(
    currentUser?.skills || ['svc_coconut', 'svc_palm']
  );

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

  const handleToggleSkill = (serviceId) => {
    setSelectedSkills((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    const updatedData = {
      full_name: fullName.trim(),
      experience_years: Number(experienceYears),
      safety_cert: safetyCert.trim(),
      taluka,
      skills: selectedSkills,
      avatar_url: avatarUrl || null
    };

    updateCurrentUser(updatedData);
    updateProfessionalProfile(updatedData);
  };

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'P';

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3>Professional Skills & Safety Profile</h3>
            <p className="cell-muted">
              Configure your verified experience, profile photo, Taluka service area, and service skills.
            </p>
          </div>
          <StatusBadge status={currentUser?.status || 'approved'} />
        </div>

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
                  border: '3px solid var(--gold)',
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
              Professional Photo
            </b>
            <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: '2px 0 10px' }}>
              Upload your climber photo for job identity verification (up to 5MB).
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
              label="Years of Tree Climbing Experience"
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              required
            />
          </div>

          <div className="field-row">
            <Select
              label="Primary Operating Taluka"
              value={taluka}
              onChange={(e) => setTaluka(e.target.value)}
              options={TALUKAS}
              required
              hint="Only bookings in this Taluka are assigned to you"
            />
            <Input
              label="Safety Certification / Training Body"
              placeholder="e.g. Certified Master Climber (CPCRI / Agricultural Dept)"
              value={safetyCert}
              onChange={(e) => setSafetyCert(e.target.value)}
              hint="Approved climbers receive verified badges"
            />
          </div>

          {/* Service Skills Selection (Bridge Table: professional_skills) */}
          <div style={{ marginTop: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--ink-soft)',
                marginBottom: '10px',
                textTransform: 'uppercase'
              }}
            >
              Select Service Capabilities You Offer
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px'
              }}
            >
              {services.map((svc) => {
                const isChecked = selectedSkills.includes(svc.id);
                return (
                  <div
                    key={svc.id}
                    className="checkline"
                    style={{
                      padding: '12px 14px',
                      background: isChecked ? 'rgba(31, 138, 130, 0.08)' : 'var(--cream)',
                      borderRadius: '8px',
                      border: `1px solid ${isChecked ? 'rgba(31, 138, 130, 0.3)' : 'var(--line)'}`,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleToggleSkill(svc.id)}
                  >
                    <input
                      type="checkbox"
                      id={`skill_${svc.id}`}
                      checked={isChecked}
                      onChange={() => {}}
                    />
                    <label htmlFor={`skill_${svc.id}`} style={{ cursor: 'pointer', fontWeight: isChecked ? '600' : '400' }}>
                      {svc.icon} {svc.name}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button variant="primary" icon={Save} type="submit">
              Save Capabilities
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
