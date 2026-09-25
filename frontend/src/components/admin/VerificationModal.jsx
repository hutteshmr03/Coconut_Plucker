import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

export const VerificationModal = ({ isOpen, onClose, professional, services, onDecision }) => {
  if (!professional) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Review Professional: ${professional.full_name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            icon={XCircle}
            onClick={() => {
              onDecision(professional.id, 'reject');
              onClose();
            }}
          >
            Reject Profile
          </Button>
          <Button
            variant="primary"
            icon={CheckCircle2}
            onClick={() => {
              onDecision(professional.id, 'approve');
              onClose();
            }}
          >
            Approve & Verify
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
        <div className="worker-avatar" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
          {professional.full_name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </div>
        <div>
          <h4 style={{ fontSize: '16px' }}>{professional.full_name}</h4>
          <div className="cell-muted">{professional.phone} · Taluka: <b>{professional.taluka}</b></div>
        </div>
      </div>

      <div className="kpi-line">
        <span>Climbing Experience</span>
        <b>{professional.experience_years} years</b>
      </div>
      <div className="kpi-line">
        <span>Safety Certification</span>
        <b>{professional.safety_cert || 'Self-Declared Experienced Climber'}</b>
      </div>
      <div className="kpi-line">
        <span>Current Status</span>
        <b style={{ textTransform: 'capitalize' }}>{professional.status}</b>
      </div>

      <div style={{ marginTop: '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--ink-soft)',
            marginBottom: '8px',
            textTransform: 'uppercase'
          }}
        >
          Selected Service Skills
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {professional.skills.map((sId) => {
            const svc = services.find((s) => s.id === sId);
            return (
              <span
                key={sId}
                style={{
                  background: 'var(--cream)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid var(--line)',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                {svc?.icon} {svc?.name}
              </span>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
