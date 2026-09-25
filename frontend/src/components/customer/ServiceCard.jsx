import React from 'react';
import { Button } from '../common/Button';
import { ArrowRight, Ruler } from 'lucide-react';

export const ServiceCard = ({ service, onSelect }) => {
  return (
    <div className="svc-card" onClick={onSelect}>
      {service.requires_height_category ? (
        <span className="risk-chip height-req">
          <Ruler size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Height Tier Applies
        </span>
      ) : (
        <span className="risk-chip" style={{ background: 'rgba(63, 122, 78, 0.12)', color: 'var(--leaf)' }}>
          Standard Rate
        </span>
      )}

      <div className="svc-ic">{service.icon}</div>
      <h4>{service.name}</h4>
      <p>{service.desc}</p>

      <div className="svc-foot">
        <div>
          <span style={{ fontSize: '11px', color: 'var(--ink-soft)', display: 'block' }}>Base Rate</span>
          <span className="svc-price">
            ₹{service.base_rate} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--ink-soft)' }}>/{service.unit.replace('per ', '')}</span>
          </span>
        </div>
        <Button variant="ghost" size="sm" icon={ArrowRight}>
          Book
        </Button>
      </div>
    </div>
  );
};
