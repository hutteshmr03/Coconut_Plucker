import React, { useState } from 'react';
import { getDisplayName } from '../../utils/helpers';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { UserCheck, Star, MapPin, CheckCircle } from 'lucide-react';

export const AssignWorkerModal = ({
  isOpen,
  onClose,
  booking,
  professionals,
  services,
  onAssign
}) => {
  const [selectedProId, setSelectedProId] = useState('');

  if (!booking) return null;

  const activeService = services.find((s) => s.id === booking.service_id);

  // Filter and sort professionals based on skill and Taluka match
  const eligiblePros = professionals
    .filter((p) => p.status === 'approved')
    .sort((a, b) => {
      // Prioritize same Taluka
      const aTaluka = a.taluka === booking.taluka ? 2 : 0;
      const bTaluka = b.taluka === booking.taluka ? 2 : 0;

      // Prioritize skill match
      const aSkill = a.skills.includes(booking.service_id) ? 1 : 0;
      const bSkill = b.skills.includes(booking.service_id) ? 1 : 0;

      return (bTaluka + bSkill) - (aTaluka + aSkill);
    });

  const handleAssign = () => {
    if (!selectedProId) return;
    onAssign(booking.id, selectedProId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Professional to ${booking.booking_number}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!selectedProId}
            icon={UserCheck}
            onClick={handleAssign}
          >
            Confirm Assignment
          </Button>
        </>
      }
    >
      <div style={{ marginBottom: '16px', background: 'var(--cream)', padding: '12px 14px', borderRadius: '10px' }}>
        <div className="kpi-line" style={{ padding: '4px 0' }}>
          <span>Service Needed</span>
          <b>{activeService?.icon} {activeService?.name}</b>
        </div>
        <div className="kpi-line" style={{ padding: '4px 0' }}>
          <span>Customer Taluka</span>
          <b>{booking.taluka}</b>
        </div>
        <div className="kpi-line" style={{ padding: '4px 0' }}>
          <span>Quantity & Schedule</span>
          <b>{booking.tree_count} trees · {new Date(booking.scheduled_at).toLocaleDateString()}</b>
        </div>
      </div>

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
        Select Verified Professional ({eligiblePros.length} Available)
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
        {eligiblePros.map((pro) => {
          const isSelected = selectedProId === pro.id;
          const isTalukaMatch = pro.taluka === booking.taluka;
          const isSkillMatch = pro.skills.includes(booking.service_id);

          return (
            <div
              key={pro.id}
              onClick={() => setSelectedProId(pro.id)}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                border: `2px solid ${isSelected ? 'var(--teal)' : 'var(--line)'}`,
                background: isSelected ? 'rgba(31, 138, 130, 0.06)' : 'var(--paper)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease'
              }}
            >
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--ink)' }}>
                  {getDisplayName(pro)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                  {pro.experience_years} yrs exp · Taluka: <b>{pro.taluka}</b> · ★ {pro.rating_avg}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  {isTalukaMatch && (
                    <span className="badge green" style={{ fontSize: '10px', padding: '2px 6px' }}>
                      In Same Taluka
                    </span>
                  )}
                  {isSkillMatch && (
                    <span className="badge blue" style={{ fontSize: '10px', padding: '2px 6px' }}>
                      Skill Match
                    </span>
                  )}
                  <span className="badge gold" style={{ fontSize: '10px', padding: '2px 6px' }}>
                    {pro.safety_cert ? 'Certified' : 'Active'}
                  </span>
                </div>
              </div>

              {isSelected && <CheckCircle size={20} color="var(--teal)" />}
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
