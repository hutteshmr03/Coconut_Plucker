import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ServiceFormModal } from '../components/admin/ServiceFormModal';
import { getServiceImage } from '../utils/helpers';
import { Plus, Edit2, Power, Ruler, Trash2, AlertTriangle } from 'lucide-react';

export const AdminServices = () => {
  const { services, addService, updateService, toggleServiceStatus, deleteService } = useApp();

  const [editingService, setEditingService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingService, setDeletingService] = useState(null);

  const handleOpenAdd = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (svc) => {
    setEditingService(svc);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingService) {
      deleteService(deletingService.id);
      setDeletingService(null);
    }
  };

  const handleSave = (serviceData) => {
    if (editingService) {
      updateService(editingService.id, serviceData);
    } else {
      addService(serviceData);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3>Dynamic Service Catalog Management</h3>
          <p className="cell-muted">
            Add, update, or activate/deactivate services. Changes appear immediately in the customer booking flow.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Add New Service
        </Button>
      </div>

      {/* Services Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Unit</th>
              <th>Base Rate</th>
              <th>Height Category Required?</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((svc) => (
              <tr key={svc.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={getServiceImage(svc)}
                      alt={svc.name}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid var(--line)',
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <div className="cell-strong">{svc.name}</div>
                      <div className="cell-muted" style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {svc.desc}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="cell-muted">{svc.unit}</td>
                <td>
                  <span style={{ fontWeight: '700', color: 'var(--teal)', fontSize: '14px' }}>
                    ₹{Number(svc.base_rate).toFixed(2)}
                  </span>
                </td>
                <td>
                  {svc.requires_height_category ? (
                    <span className="badge gold">
                      <Ruler size={12} /> Yes (Trimming Tier)
                    </span>
                  ) : (
                    <span className="badge gray">No</span>
                  )}
                </td>
                <td>
                  <StatusBadge status={svc.status} />
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-btn"
                      title="Edit Service"
                      onClick={() => handleOpenEdit(svc)}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className={`icon-btn ${svc.status === 'active' ? 'del' : ''}`}
                      title={svc.status === 'active' ? 'Deactivate' : 'Activate'}
                      onClick={() => toggleServiceStatus(svc.id)}
                    >
                      <Power size={14} />
                    </button>
                    <button
                      className="icon-btn del"
                      title="Delete Service"
                      onClick={() => setDeletingService(svc)}
                      style={{ color: 'var(--danger)' }}
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

      {/* Service Create / Edit Modal */}
      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        service={editingService}
      />

      {/* Custom Delete Confirmation Modal */}
      {deletingService && (
        <Modal
          isOpen={!!deletingService}
          onClose={() => setDeletingService(null)}
          title="Delete Service from Catalog"
          maxWidth="480px"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeletingService(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={Trash2}
                onClick={handleConfirmDelete}
              >
                Delete Service
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <AlertTriangle size={22} color="var(--danger)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: 'var(--ink)' }}>
                Are you sure you want to permanently delete this service? This action cannot be undone.
              </div>
            </div>

            <div
              style={{
                background: 'var(--cream)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <img
                src={getServiceImage(deletingService)}
                alt={deletingService.name}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '6px',
                  objectFit: 'cover',
                  border: '1px solid var(--line)',
                  flexShrink: 0
                }}
              />
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--ink)' }}>
                  {deletingService.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                  Rate: <b>₹{Number(deletingService.base_rate).toFixed(2)}</b> / {deletingService.unit?.replace('per ', '') || 'tree'}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
