import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Calendar, Save, CheckCircle2, Sliders, MapPin } from 'lucide-react';

export const SuperAdminScheduling = () => {
  const [northDays, setNorthDays] = useState(['Monday', 'Tuesday', 'Wednesday']);
  const [southDays, setSouthDays] = useState(['Thursday', 'Friday', 'Saturday']);
  const [maxDailyBookings, setMaxDailyBookings] = useState(15);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div style={{ maxWidth: '820px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3>Taluka & Regional Scheduling Governance</h3>
          <p className="cell-muted">
            Configure operational days and booking capacity allocated to North Goa vs. South Goa & Kushavati.
          </p>
        </div>
      </div>

      {savedNotice && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(47, 122, 77, 0.12)',
            color: 'var(--success)',
            borderRadius: '8px',
            border: '1px solid rgba(47, 122, 77, 0.3)',
            marginBottom: '18px',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} />
          Regional schedule configuration saved and applied to customer booking engine.
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="two-col">
          {/* North Goa Region */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <MapPin size={18} color="var(--teal)" />
              <h3 style={{ margin: 0 }}>North Goa Region</h3>
            </div>
            <p className="cell-muted" style={{ fontSize: '12px', marginBottom: '14px' }}>
              Includes Bardez, Tiswadi, Bicholim, Sattari, Pernem.
            </p>

            <div className="field">
              <label>Allocated Service Days</label>
              <div style={{ background: 'var(--cream)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px', fontWeight: 600 }}>
                {northDays.join(', ')}
              </div>
              <div className="field-hint">Fixed Mon–Wed rotation for climber dispatch.</div>
            </div>
          </Card>

          {/* South Goa & Kushavati Region */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <MapPin size={18} color="var(--amber)" />
              <h3 style={{ margin: 0 }}>South Goa & Kushavati</h3>
            </div>
            <p className="cell-muted" style={{ fontSize: '12px', marginBottom: '14px' }}>
              Includes Salcete, Mormugao, Ponda, Quepem, Sanguem, Canacona.
            </p>

            <div className="field">
              <label>Allocated Service Days</label>
              <div style={{ background: 'var(--cream)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px', fontWeight: 600 }}>
                {southDays.join(', ')}
              </div>
              <div className="field-hint">Fixed Thu–Sat rotation for climber dispatch.</div>
            </div>
          </Card>
        </div>

        <Card style={{ marginTop: '20px' }}>
          <h3>Platform Capacity & Dispatch Limits</h3>
          <div className="field" style={{ maxWidth: '300px', marginTop: '14px' }}>
            <label>Max Daily Concurrent Bookings Per Taluka</label>
            <input
              type="number"
              value={maxDailyBookings}
              onChange={(e) => setMaxDailyBookings(e.target.value)}
              min="1"
              max="50"
            />
            <div className="field-hint">Prevents overbooking beyond active verified workforce.</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="primary" icon={Save} type="submit">
              Save Scheduling Settings
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
