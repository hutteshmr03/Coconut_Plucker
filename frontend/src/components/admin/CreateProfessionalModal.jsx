import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { compressImageFile } from '../../utils/helpers';
import { UserPlus, CheckSquare, Square, Upload } from 'lucide-react';

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
  const [safetyCert, setSafetyCert] = useState('');
  const [insuranceCover, setInsuranceCover] = useState('no');
  const [insuranceCoverImg, setInsuranceCoverImg] = useState('');
  const [insuranceImgName, setInsuranceImgName] = useState('');
  const [status, setStatus] = useState('approved');
  const [selectedSkills, setSelectedSkills] = useState(['svc_coconut', 'svc_areca', 'svc_palm']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && Array.isArray(services) && services.length > 0) {
      setSelectedSkills((prev) => {
        const validIds = prev.filter((id) => services.some((s) => s.id === id));
        return validIds.length > 0 ? validIds : services.slice(0, 3).map((s) => s.id);
      });
    }
  }, [isOpen, services]);

  const toggleSkill = (serviceId) => {
    setSelectedSkills((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleInsuranceFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, etc.) for Insurance Cover');
      return;
    }
    try {
      const compressed = await compressImageFile(file, 900, 900, 0.78);
      setInsuranceCoverImg(compressed);
      setInsuranceImgName(file.name);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to read Insurance Cover image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pClean = phone.replace(/\D/g, '');

    if (!fullName.trim()) {
      setError('Please enter the professional’s full name');
      return;
    }
    if (!pClean || pClean.length !== 10) {
      setError('Mobile phone number must be exactly 10 digits');
      return;
    }
    if (!taluka) {
      setError('Please select a Taluka');
      return;
    }
    if (insuranceCover === 'yes' && !insuranceCoverImg) {
      setError('Please upload the Insurance Cover image');
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
        safety_cert: safetyCert.trim() || '',
        insurance_cover: insuranceCover === 'yes',
        insurance_cover_img: insuranceCover === 'yes' ? insuranceCoverImg : null,
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
      setSafetyCert('');
      setInsuranceCover('no');
      setInsuranceCoverImg('');
      setInsuranceImgName('');
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
        {error && (
          <div className="field-error" style={{ marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <div className="field-row">
          <Input
            label="Full Name"
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
          />
        </div>

        <div className="field-row">
          <Input
            label="Phone Number"
            type="tel"
            maxLength={10}
            placeholder="e.g. 9822300004"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            required
          />

          <Select
            label="Taluka"
            value={taluka}
            onChange={(e) => setTaluka(e.target.value)}
            options={TALUKAS}
            required
          />
        </div>

        <div className="field-row">
          <Input
            label="Climbing Experience (Years)"
            type="number"
            min="1"
            max="40"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            required
          />
        </div>

        <Input
          label="Safety Certification & Training Details (Optional)"
          placeholder="e.g. Govt. CPCRI Certified Master Climber / Palm Safety Harness Trained"
          value={safetyCert}
          onChange={(e) => setSafetyCert(e.target.value)}
        />

        <div className="field">
          <label>
            Insurance Cover <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setInsuranceCover('yes');
                setError('');
              }}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13.5px',
                border: `1.5px solid ${insuranceCover === 'yes' ? 'var(--teal)' : 'var(--line)'}`,
                background: insuranceCover === 'yes' ? 'rgba(31, 138, 130, 0.12)' : 'var(--cream)',
                color: insuranceCover === 'yes' ? 'var(--teal)' : 'var(--ink-soft)',
                transition: 'all 0.15s ease'
              }}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => {
                setInsuranceCover('no');
                setInsuranceCoverImg('');
                setInsuranceImgName('');
                setError('');
              }}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13.5px',
                border: `1.5px solid ${insuranceCover === 'no' ? 'var(--teal)' : 'var(--line)'}`,
                background: insuranceCover === 'no' ? 'rgba(31, 138, 130, 0.12)' : 'var(--cream)',
                color: insuranceCover === 'no' ? 'var(--teal)' : 'var(--ink-soft)',
                transition: 'all 0.15s ease'
              }}
            >
              No
            </button>
          </div>
        </div>

        {insuranceCover === 'yes' && (
          <div className="field">
            <label>
              Insurance Cover Image <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div
              style={{
                background: 'var(--cream)',
                border: '1.5px dashed var(--teal)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              {insuranceCoverImg ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <img
                      src={insuranceCoverImg}
                      alt="Insurance Cover Preview"
                      style={{
                        width: '54px',
                        height: '54px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '220px'
                        }}
                      >
                        {insuranceImgName || 'Insurance document uploaded'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--success)', fontWeight: 600 }}>
                        Uploaded successfully
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        background: 'var(--paper)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        cursor: 'pointer',
                        margin: 0
                      }}
                    >
                      Change
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleInsuranceFileChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setInsuranceCoverImg('');
                        setInsuranceImgName('');
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        background: 'var(--paper)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--danger)'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <label
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    color: 'var(--teal)',
                    fontWeight: 600,
                    fontSize: '13px',
                    margin: 0,
                    padding: '6px 0'
                  }}
                >
                  <Upload size={16} />
                  <span>Click to upload Insurance Cover image (JPG, PNG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleInsuranceFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </div>
        )}

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
