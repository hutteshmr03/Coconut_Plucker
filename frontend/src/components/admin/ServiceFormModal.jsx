import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Ruler } from 'lucide-react';

export const ServiceFormModal = ({ isOpen, onClose, onSave, service }) => {
  const [name, setName] = useState('');
  const [baseRate, setBaseRate] = useState('');
  const [unit, setUnit] = useState('per tree');
  const [icon, setIcon] = useState('🌴');
  const [desc, setDesc] = useState('');
  const [requiresHeightCategory, setRequiresHeightCategory] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (service) {
      setName(service.name || '');
      setBaseRate(service.base_rate || '');
      setUnit(service.unit || 'per tree');
      setIcon(service.icon || '🌴');
      setDesc(service.desc || '');
      setRequiresHeightCategory(!!service.requires_height_category);
    } else {
      setName('');
      setBaseRate('');
      setUnit('per tree');
      setIcon('🌴');
      setDesc('');
      setRequiresHeightCategory(false);
    }
    setError('');
  }, [service, isOpen]);

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

    const payload = {
      name: name.trim(),
      base_rate: Number(baseRate),
      unit: unit.trim(),
      icon: icon.trim() || '🌴',
      desc: desc.trim(),
      requires_height_category: requiresHeightCategory
    };

    onSave(payload);
    onClose();
  };

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
            label="Icon (Emoji)"
            placeholder="e.g. 🐛"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
          />
        </div>

        <div className="field-row">
          <Input
            label="Base Rate (₹)"
            type="number"
            step="0.01"
            placeholder="e.g. 180.00"
            value={baseRate}
            onChange={(e) => setBaseRate(e.target.value)}
            required
          />
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
