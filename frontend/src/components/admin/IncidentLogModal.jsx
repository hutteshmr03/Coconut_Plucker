import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { AlertTriangle } from 'lucide-react';

export const IncidentLogModal = ({ isOpen, onClose, onLog, professionals, bookings }) => {
  const [proId, setProId] = useState(professionals[0]?.id || '');
  const [bookingId, setBookingId] = useState('');
  const [type, setType] = useState('Near-miss');
  const [severity, setSeverity] = useState('low');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    const pro = professionals.find((p) => p.id === proId);

    onLog({
      booking_id: bookingId || null,
      reported_by_id: proId,
      reported_by_name: pro?.full_name || 'Professional',
      type,
      severity,
      description: description.trim()
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Safety & Field Incident"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" icon={AlertTriangle} onClick={handleSubmit}>
            Submit Incident Report
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="field-row">
          <Select
            label="Involved Professional"
            value={proId}
            onChange={(e) => setProId(e.target.value)}
            options={professionals.map((p) => ({
              value: p.id,
              label: `${p.full_name} (${p.taluka})`
            }))}
            required
          />

          <Select
            label="Incident Classification"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { value: 'Near-miss', label: 'Near-miss' },
              { value: 'Equipment Note', label: 'Equipment Wear / Replacement' },
              { value: 'Hazard Alert', label: 'Site Hazard (Power line / Rot)' },
              { value: 'Weather Abort', label: 'Weather / Rain Abort' }
            ]}
          />
        </div>

        <Select
          label="Severity Level"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          options={[
            { value: 'low', label: 'Low — Advisory / No Injury' },
            { value: 'medium', label: 'Medium — Required Abort or Gear Swap' },
            { value: 'high', label: 'High — Immediate Operations Review' }
          ]}
        />

        <div className="field">
          <label>Incident Description & Corrective Actions Taken</label>
          <textarea
            placeholder="Describe what occurred on-site, safety measures taken, and equipment notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </div>
      </form>
    </Modal>
  );
};
