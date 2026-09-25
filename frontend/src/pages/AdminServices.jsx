import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { ServiceFormModal } from '../components/admin/ServiceFormModal';
import { Plus, Edit2, Power, Ruler } from 'lucide-react';

export const AdminServices = () => {
  const { services, addService, updateService, toggleServiceStatus } = useApp();

  const [editingService, setEditingService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenAdd = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (svc) => {
    setEditingService(svc);
    setIsModalOpen(true);
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px' }}>{svc.icon}</span>
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
    </div>
  );
};
