import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { getServiceImage, compressImageFile } from '../../utils/helpers';
import { Upload, Camera, Trash2, Image as ImageIcon } from 'lucide-react';

export const ServiceFormModal = ({ isOpen, onClose, onSave, service }) => {
  const fileInputRef = useRef(null);
  const [name, setName] = useState('');
  const [baseRate, setBaseRate] = useState('');
  const [unit, setUnit] = useState('per tree');
  const [imageUrl, setImageUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [requiresHeightCategory, setRequiresHeightCategory] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (service) {
      setName(service.name || '');
      setBaseRate(service.base_rate || '');
      setUnit(service.unit || 'per tree');
      setImageUrl(service.image_url || service.image || '');
      setDesc(service.desc || '');
      setRequiresHeightCategory(!!service.requires_height_category);
    } else {
      setName('');
      setBaseRate('');
      setUnit('per tree');
      setImageUrl('');
      setDesc('');
      setRequiresHeightCategory(false);
    }
    setError('');
  }, [service, isOpen]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 600, 600, 0.75);
        setImageUrl(compressed);
        setError('');
      } catch (err) {
        setError('Could not process image file. Please try another image.');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Service name is required');
      return;
    }
    if (!baseRate || Number(baseRate) <= 0) {
      setError('Valid base rate is required');
      return;
    }
    if (!imageUrl && !service?.image_url && !service?.image) {
      setError('Service Photo / Image is mandatory. Please upload an image.');
      return;
    }

    const payload = {
      name: name.trim(),
      base_rate: Number(baseRate),
      unit: unit.trim(),
      image_url: imageUrl || (service?.image_url || null),
      image: imageUrl || (service?.image || null),
      icon: imageUrl || service?.icon || '🌴',
      desc: desc.trim(),
      requires_height_category: requiresHeightCategory
    };

    onSave(payload);
    onClose();
  };

  const hasPhoto = Boolean(imageUrl || service?.image_url || service?.image);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={service ? `Edit Service: ${service.name}` : 'Add New Service'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {service ? 'Save Changes' : 'Create Service'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="field-error" style={{ marginBottom: '14px' }}>{error}</div>}

        <div className="field-row">
          <Input
            label="Service Name"
            placeholder="e.g. Beetle Infestation Treatment"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Base Rate (₹)"
            type="number"
            step="0.01"
            placeholder="e.g. 180.00"
            value={baseRate}
            onChange={(e) => setBaseRate(e.target.value)}
            required
          />
        </div>

        <div className="field-row" style={{ alignItems: 'flex-start' }}>
          <Select
            label="Pricing Unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            options={[
              { value: 'per tree', label: 'per tree' },
              { value: 'per acre', label: 'per acre' },
              { value: 'per visit', label: 'per visit' },
              { value: 'per hour', label: 'per hour' }
            ]}
            required
          />

          {/* Service Image File Upload Field - MANDATORY */}
          <div className="field" style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Service Photo / Image <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {hasPhoto ? (
                <img
                  src={imageUrl || getServiceImage(service || { name })}
                  alt={name || 'Service'}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '6px',
                    objectFit: 'cover',
                    border: '1px solid var(--line)',
                    flexShrink: 0
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '6px',
                    border: '1.5px dashed var(--danger, #e53e3e)',
                    background: 'var(--cream)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ink-soft)',
                    flexShrink: 0
                  }}
                >
                  <ImageIcon size={18} />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant={hasPhoto ? 'secondary' : 'primary'}
                size="sm"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
              >
                {hasPhoto ? 'Change Photo' : 'Upload Photo *'}
              </Button>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            {!hasPhoto && (
              <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>
                Required: Please upload a service photo
              </div>
            )}
          </div>
        </div>

        <div className="field">
          <label>Short Customer Description</label>
          <textarea
            placeholder="Detailed scope of service, crew size, and safety requirements..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
          />
        </div>

        {/* KEY BUSINESS RULE: requires_height_category flag */}
        <div
          style={{
            background: 'rgba(216, 163, 61, 0.08)',
            border: '1px solid rgba(216, 163, 61, 0.25)',
            padding: '14px 16px',
            borderRadius: 'var(--radius)',
            marginTop: '10px'
          }}
        >
          <div className="checkline" style={{ marginBottom: 0 }}>
            <input
              type="checkbox"
              id="f_req_height"
              checked={requiresHeightCategory}
              onChange={(e) => setRequiresHeightCategory(e.target.checked)}
            />
            <label htmlFor="f_req_height" style={{ fontWeight: '700', color: 'var(--ink)' }}>
              Requires Height Category (Low / Medium / High Tiers)
            </label>
          </div>
          <div className="field-hint" style={{ marginTop: '6px' }}>
            When enabled, customers booking this service will be prompted and required to choose a height category tier.
          </div>
        </div>
      </form>
    </Modal>
  );
};
