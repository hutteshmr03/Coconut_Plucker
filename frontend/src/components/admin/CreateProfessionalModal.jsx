import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { ShieldCheck, UserPlus, CheckSquare, Square } from 'lucide-react';

const TALUKAS = [
  { value: '', label: '-- Select one --' },
  { value: 'North Goa', label: 'North Goa' },
  { value: 'South Goa', label: 'South Goa' },
  { value: 'Kushavati', label: 'Kushavati' }
];

export const CreateProfessionalModal = ({ isOpen, onClose, services, onCreate }) => {
  const [fullName, setFullName] = useState('');
  const [fullNameLocal, setFullNameLocal] = useState('');
  const [phone, setPhone] = useState('');
  const [taluka, setTaluka] = useState('');
  const [experienceYears, setExperienceYears] = useState('5');
  const [safetyCert, setSafetyCert] = useState('Certified Master Climber (Govt. CPCRI Certified)');
  const [status, setStatus] = useState('approved');
  const [selectedSkills, setSelectedSkills] = useState(['svc_coconut', 'svc_areca', 'svc_palm']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSkill = (serviceId) => {
    setSelectedSkills((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pClean = phone.replace(/\D/g, '');

    if (!fullName.trim()) {
      setError('Please enter the professional’s full name');
      return;
    }
    if (!pClean || pClean.length < 10) {
      setError('Please enter a valid 10-digit mobile phone number');
      return;
    }
    if (selectedSkills.length === 0) {
      setError('Please select at least one skill / tree service capability');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onCreate({
        full_name: fullName.trim(),
        full_name_local: fullNameLocal.trim() || undefined,
        phone: pClean,
        taluka,
        experience_years: Number(experienceYears) || 1,
        safety_cert: safetyCert.trim() || 'Verified Professional Climber',
        status,
        skills: selectedSkills,
        rating_avg: 5.0
      });

      // Reset form
      setFullName('');
      setFullNameLocal('');
      setPhone('');
      setTaluka('');
      setExperienceYears('5');
      setSafetyCert('Certified Master Climber (Govt. CPCRI Certified)');
      setStatus('approved');
      setSelectedSkills(['svc_coconut', 'svc_areca', 'svc_palm']);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create professional account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Onboard / Create Professional Climber Account"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="gold"
            icon={UserPlus}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create & Activate Climber'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} autoComplete="off">
        <p className="cell-muted" style={{ marginBottom: '16px', fontSize: '13px' }}>
          Create a verified professional climber account. The climber can immediately log in with their phone number using OTP.
        </p>

        {error && (
          <div className="field-error" style={{ marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <div className="field-row">
          <Input
            label="Full Name (English) *"
            placeholder="e.g. Anand Gaonkar"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Name in Native Script (स्थानिक नाव)"
            placeholder="उदा. आनंद गावकर"
            value={fullNameLocal}
            onChange={(e) => setFullNameLocal(e.target.value)}
            hint="For Hindi & Marathi display"
          />
        </div>

        <div className="field-row">
          <Input
            label="Mobile Phone Number *"
            type="tel"
            placeholder="e.g. 9822300004"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            required
            hint="Used for Climber OTP Login"
          />

          <Select
            label="Taluka (Base Region) *"
            value={taluka}
            onChange={(e) => setTaluka(e.target.value)}
            options={TALUKAS}
            required
          />
        </div>

        <div className="field-row">
          <Input
            label="Climbing Experience (Years) *"
            type="number"
            min="1"
            max="40"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            required
          />
        </div>

        <Input
          label="Safety Certification & Training Details"
          placeholder="e.g. Govt. CPCRI Certified Master Climber / Palm Safety Harness Trained"
          value={safetyCert}
          onChange={(e) => setSafetyCert(e.target.value)}
          required
        />

        <div className="field-row">
          <Select
            label="Initial Account Verification Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'approved', label: 'Approved & Active (Instant Dispatch Ready)' },
              { value: 'pending_verification', label: 'Pending Verification (Requires Manual Approval)' }
            ]}
            required
          />
        </div>

        {/* Tree Skills Checklist */}
        <div style={{ marginTop: '14px' }}>
          <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', marginBottom: '8px', color: 'var(--ink)' }}>
            Certified Skills & Service Capabilities ({selectedSkills.length} Selected)
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '8px',
              background: 'var(--cream)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--line)'
            }}
          >
            {services?.map((svc) => {
              const isChecked = selectedSkills.includes(svc.id);
              return (
                <div
                  key={svc.id}
                  onClick={() => toggleSkill(svc.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    background: isChecked ? 'rgba(31, 138, 130, 0.12)' : 'var(--paper)',
                    border: `1px solid ${isChecked ? 'var(--teal)' : 'var(--line)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    fontWeight: isChecked ? '700' : '500',
                    color: isChecked ? 'var(--teal-dark)' : 'var(--ink)'
                  }}
                >
                  {isChecked ? (
                    <CheckSquare size={16} color="var(--teal)" />
                  ) : (
                    <Square size={16} color="var(--ink-soft)" />
                  )}
                  <span>{svc.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
};
