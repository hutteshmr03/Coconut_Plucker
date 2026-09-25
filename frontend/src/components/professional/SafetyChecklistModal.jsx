import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

const SAFETY_ITEMS = [
  'Full-body climbing harness, lanyards, and carabiners inspected for wear',
  'Safety helmet, non-slip climbing boots, and grip gloves securely worn',
  'Ground perimeter clear of bystanders, vehicles, and pets',
  'Trunk condition tested for termite hollows, rot, or high-voltage lines',
  'Spotter / ground helper briefed on emergency lowering protocol'
];

export const SafetyChecklistModal = ({ isOpen, onClose, onConfirm, booking }) => {
  const [checked, setChecked] = useState({});

  if (!booking) return null;

  const handleToggle = (index) => {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const isAllChecked = SAFETY_ITEMS.every((_, idx) => !!checked[idx]);

  const handleStart = () => {
    if (!isAllChecked) return;
    onConfirm(booking.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pre-Climb Safety Verification"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!isAllChecked}
            icon={ShieldCheck}
            onClick={handleStart}
          >
            Confirm Safety & Start Job
          </Button>
        </>
      }
    >
      <div
        style={{
          background: 'rgba(31, 138, 130, 0.08)',
          border: '1px solid rgba(31, 138, 130, 0.25)',
          padding: '14px 16px',
          borderRadius: 'var(--radius)',
          marginBottom: '16px',
          display: 'flex',
          gap: '10px'
        }}
      >
        <ShieldCheck size={20} color="var(--teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '12.5px', color: 'var(--ink)' }}>
          <b>Zero Incident Protocol:</b> For your safety and insurance coverage, confirm that all 5 safety checkpoints are verified before ascending.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {SAFETY_ITEMS.map((item, idx) => (
          <div
            key={idx}
            className="checkline"
            style={{
              padding: '10px 14px',
              background: checked[idx] ? 'rgba(47, 122, 77, 0.08)' : 'var(--cream)',
              borderRadius: '8px',
              border: `1px solid ${checked[idx] ? 'rgba(47, 122, 77, 0.3)' : 'var(--line)'}`,
              cursor: 'pointer'
            }}
            onClick={() => handleToggle(idx)}
          >
            <input
              type="checkbox"
              id={`chk_${idx}`}
              checked={!!checked[idx]}
              onChange={() => {}}
            />
            <label htmlFor={`chk_${idx}`} style={{ cursor: 'pointer' }}>
              {item}
            </label>
          </div>
        ))}
      </div>
    </Modal>
  );
};
