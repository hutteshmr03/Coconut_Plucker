import React, { useState } from 'react';
import { getCleanServiceIcon } from '../../utils/helpers';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CheckCircle2, XCircle, Eye, Download } from 'lucide-react';

export const VerificationModal = ({ isOpen, onClose, professional, services, onDecision }) => {
  const [isInsurancePreviewOpen, setIsInsurancePreviewOpen] = useState(false);
  if (!professional) return null;

  return (
    <>
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
        <span>Insurance Cover</span>
        <b>{professional.insurance_cover ? 'Yes' : 'No'}</b>
      </div>
      {professional.insurance_cover && professional.insurance_cover_img && (
        <div style={{ marginTop: '10px', marginBottom: '6px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '11.5px',
              fontWeight: '700',
              color: 'var(--ink-soft)',
              marginBottom: '6px',
              textTransform: 'uppercase'
            }}
          >
            Insurance Cover Document
          </label>
          <button
            type="button"
            onClick={() => setIsInsurancePreviewOpen(true)}
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '6px',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer'
            }}
            title="View full Insurance Cover document"
          >
            <img
              src={professional.insurance_cover_img}
              alt="Insurance Cover"
              style={{
                maxWidth: '100%',
                maxHeight: '160px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                objectFit: 'contain',
                background: 'var(--cream)'
              }}
            />
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--teal)'
              }}
            >
              <Eye size={13} /> Click to View Full Document
            </span>
          </button>
        </div>
      )}
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
                {getCleanServiceIcon(svc)} {svc?.name}
              </span>
            );
          })}
        </div>
      </div>
    </Modal>

    {isInsurancePreviewOpen && professional.insurance_cover_img && (
      <Modal
        isOpen={isInsurancePreviewOpen}
        onClose={() => setIsInsurancePreviewOpen(false)}
        title={`Insurance Cover Document · ${professional.full_name}`}
        footer={
          <>
            <a
              href={professional.insurance_cover_img}
              download={`insurance-${professional.phone || 'document'}.jpg`}
              className="btn btn-ghost btn-sm"
              style={{ textDecoration: 'none' }}
            >
              <Download size={14} /> Download
            </a>
            <Button variant="primary" size="sm" onClick={() => setIsInsurancePreviewOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        <div style={{ textAlign: 'center' }}>
          <img
            src={professional.insurance_cover_img}
            alt="Insurance Cover Full View"
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              borderRadius: '8px',
              objectFit: 'contain',
              border: '1px solid var(--line)',
              background: 'var(--cream)'
            }}
          />
        </div>
      </Modal>
    )}
    </>
  );
};
