import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getDisplayName } from '../utils/helpers';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { VerificationModal } from '../components/admin/VerificationModal';
import { CreateProfessionalModal } from '../components/admin/CreateProfessionalModal';
import { Search, UserCheck, Phone, UserPlus } from 'lucide-react';

export const AdminWorkforce = () => {
  const { professionals, services, verifyProfessional, addProfessional } = useApp();
  const { createProfessionalAccount } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifyingPro, setVerifyingPro] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateProfessional = async (formData) => {
    // 1. Create account in Auth database so climber can log in via OTP
    const authUser = createProfessionalAccount(formData);
    // 2. Add to active workforce list in AppContext
    addProfessional({ ...formData, id: authUser.id });
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

      {/* Workforce Table */}
      <div className="table-wrap">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={!!verifyingPro}
        onClose={() => setVerifyingPro(null)}
        professional={verifyingPro}
        services={services}
        onDecision={verifyProfessional}
      />

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
