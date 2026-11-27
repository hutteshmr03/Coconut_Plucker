import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getDisplayName } from '../utils/helpers';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { VerificationModal } from '../components/admin/VerificationModal';
import { CreateProfessionalModal } from '../components/admin/CreateProfessionalModal';
import { Search, UserCheck, Phone, UserPlus, Trash2 } from 'lucide-react';

export const AdminWorkforce = () => {
  const { professionals, services, verifyProfessional, addProfessional, deleteProfessional } = useApp();
  const { createProfessionalAccount, deleteProfessionalAccount } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifyingPro, setVerifyingPro] = useState(null);
  const [deletingPro, setDeletingPro] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateProfessional = async (formData) => {
    // 1. Create account in Auth database so climber can log in via OTP
    const authUser = createProfessionalAccount(formData);
    // 2. Add to active workforce list in AppContext
    addProfessional({ ...formData, id: authUser.id });
  };

  const handleConfirmDeletePro = async () => {
    if (!deletingPro) return;
    deleteProfessionalAccount(deletingPro.id, deletingPro.phone);
    await deleteProfessional(deletingPro.id);
    setDeletingPro(null);
  };

  const filteredPros = professionals.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.taluka.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  return (
    <div>
      {/* Top Header & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        {/* Filter Tabs */}
        <div className="tag-strip" style={{ margin: 0 }}>
          {[
            { key: 'all', label: `All Professionals (${professionals.length})` },
            { key: 'pending_verification', label: `Pending Verification (${professionals.filter((p) => p.status === 'pending_verification').length})` },
            { key: 'approved', label: `Approved & Active (${professionals.filter((p) => p.status === 'approved').length})` }
          ].map((tab) => (
            <button
              key={tab.key}
              className={`tab-pill ${statusFilter === tab.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Onboard / Create Professional Button */}
        <Button
          variant="gold"
          size="sm"
          icon={UserPlus}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Onboard Professional
        </Button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} color="var(--ink-soft)" />
          <input
            type="text"
            placeholder="Search professionals by name, phone, or Taluka..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop Workforce Table */}
      <div className="table-wrap desktop-workforce-table">
        <table>
          <thead>
            <tr>
              <th>Professional</th>
              <th>Taluka</th>
              <th>Experience</th>
              <th>Safety Certification</th>
              <th>Skills Count</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPros.map((pro) => (
              <tr key={pro.id}>
                <td>
                  <div className="cell-strong">{getDisplayName(pro)}</div>
                  <div className="cell-muted" style={{ marginTop: '3px' }}>
                    {pro?.phone ? (
                      <a
                        href={`tel:${String(pro.phone).replace(/[^0-9+]/g, '')}`}
                        className="phone-link-pill"
                        title={`Click to call ${getDisplayName(pro)} (${pro.phone})`}
                      >
                        <Phone size={10} />
                        <span>{pro.phone}</span>
                      </a>
                    ) : '—'}
                  </div>
                </td>
                <td>
                  <span className="cell-strong">{pro.taluka}</span>
                </td>
                <td className="cell-muted">{pro.experience_years} years</td>
                <td>
                  <div className="cell-muted" style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pro.safety_cert || 'Self-Declared Experienced'}
                  </div>
                </td>
                <td>
                  <span className="badge blue">{pro.skills.length} Services</span>
                </td>
                <td>
                  <StatusBadge status={pro.status} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="row-actions" style={{ alignItems: 'center' }}>
                    {pro.status === 'pending_verification' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={UserCheck}
                        onClick={() => setVerifyingPro(pro)}
                      >
                        Review & Verify
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVerifyingPro(pro)}
                      >
                        Inspect Profile
                      </Button>
                    )}
                    <button
                      type="button"
                      className="icon-btn del"
                      title="Delete Professional"
                      aria-label={`Delete ${getDisplayName(pro)}`}
                      onClick={() => setDeletingPro(pro)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Workforce Card View (Zero Horizontal Scrolling) */}
      <div className="mobile-workforce-cards">
        {filteredPros.map((pro) => (
          <div key={pro.id} className="pro-mobile-card">
            <div className="pro-mobile-card-header">
              <div>
                <div className="cell-strong" style={{ fontSize: '15px' }}>{getDisplayName(pro)}</div>
                <div style={{ marginTop: '4px' }}>
                  {pro?.phone ? (
                    <a
                      href={`tel:${String(pro.phone).replace(/[^0-9+]/g, '')}`}
                      className="phone-link-pill"
                      title={`Click to call ${getDisplayName(pro)} (${pro.phone})`}
                    >
                      <Phone size={11} />
                      <span>{pro.phone}</span>
                    </a>
                  ) : '—'}
                </div>
              </div>
              <StatusBadge status={pro.status} />
            </div>

            <div className="pro-mobile-card-body">
              <div className="pro-meta-item">
                <span className="pro-meta-lbl">Taluka</span>
                <b className="pro-meta-val">{pro.taluka}</b>
              </div>
              <div className="pro-meta-item">
                <span className="pro-meta-lbl">Experience</span>
                <span className="pro-meta-val">{pro.experience_years} yrs</span>
              </div>
              <div className="pro-meta-item">
                <span className="pro-meta-lbl">Skills</span>
                <span className="badge blue" style={{ fontSize: '11px', padding: '2px 6px', display: 'inline-block' }}>
                  {pro.skills.length} Services
                </span>
              </div>
            </div>

            {pro.safety_cert && (
              <div className="pro-mobile-cert">
                <span className="pro-meta-lbl">Cert: </span>
                <span className="cell-muted">{pro.safety_cert}</span>
              </div>
            )}

            <div className="pro-mobile-card-footer" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {pro.status === 'pending_verification' ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={UserCheck}
                  className="btn-block"
                  style={{ flex: 1 }}
                  onClick={() => setVerifyingPro(pro)}
                >
                  Review & Verify
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-block"
                  style={{ flex: 1 }}
                  onClick={() => setVerifyingPro(pro)}
                >
                  Inspect Profile
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => setDeletingPro(pro)}
                title="Delete Professional"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredPros.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink-soft)' }}>
          No professionals found matching your search or filter.
        </div>
      )}

      {/* Verification Modal */}
      <VerificationModal
        isOpen={!!verifyingPro}
        onClose={() => setVerifyingPro(null)}
        professional={verifyingPro}
        services={services}
        onDecision={verifyProfessional}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingPro}
        onClose={() => setDeletingPro(null)}
        title="Delete Professional Account Permanently?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingPro(null)}>
              Cancel
            </Button>
            <Button variant="danger" icon={Trash2} onClick={handleConfirmDeletePro}>
              Delete Permanently
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '13.5px', color: 'var(--ink)' }}>
          Are you sure you want to permanently delete <b>{getDisplayName(deletingPro)}</b> ({deletingPro?.phone}) from Professional Workforce?
        </p>
        <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--danger)', fontWeight: '600' }}>
          ⚠️ This action cannot be undone. Any unstarted assigned bookings for this climber will return to Pending Assignment.
        </p>
      </Modal>

      {/* Onboard / Create Professional Modal */}
      <CreateProfessionalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        services={services}
        onCreate={handleCreateProfessional}
      />
    </div>
  );
};
