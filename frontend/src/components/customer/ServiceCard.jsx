import React from 'react';
import { Button } from '../common/Button';
import { ArrowRight, Ruler } from 'lucide-react';

import coconutImg from '../../assets/services/coconut.png';
import arecaImg from '../../assets/services/areca.png';
import mangoImg from '../../assets/services/mango.png';
import jackfruitImg from '../../assets/services/jackfruit.jpg';
import palmImg from '../../assets/services/palm.jpg';
import trimImg from '../../assets/services/trim.jpg';

const SERVICE_IMAGES = {
  svc_coconut: coconutImg,
  svc_areca: arecaImg,
  svc_mango: mangoImg,
  svc_jackfruit: jackfruitImg,
  svc_palm: palmImg,
  svc_trim: trimImg,
};

export const ServiceCard = ({ service, onSelect }) => {
  const bgImg =
    SERVICE_IMAGES[service.id] ||
    (service.name?.toLowerCase().includes('coconut')
      ? coconutImg
      : service.name?.toLowerCase().includes('jackfruit')
      ? jackfruitImg
      : service.name?.toLowerCase().includes('mango')
      ? mangoImg
      : service.name?.toLowerCase().includes('supari') || service.name?.toLowerCase().includes('areca')
      ? arecaImg
      : service.name?.toLowerCase().includes('trim')
      ? trimImg
      : palmImg);

  return (
    <div className="svc-card" onClick={onSelect} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '100%', height: '140px', overflow: 'hidden' }}>
        <img src={bgImg} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {service.requires_height_category ? (
          <span className="risk-chip height-req">
            <Ruler size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Height Tier Applies
          </span>
        ) : (
          <span className="risk-chip" style={{ background: 'rgba(63, 122, 78, 0.9)', color: '#FFFFFF' }}>
            Standard Rate
          </span>
        )}
      </div>

      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h4 style={{ margin: '0 0 6px 0' }}>{service.name}</h4>
        <p style={{ margin: '0 0 16px 0', flex: 1 }}>{service.desc}</p>

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
    </div>
  );
};
