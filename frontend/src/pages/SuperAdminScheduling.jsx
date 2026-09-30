import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Calendar, Save, CheckCircle2, Sliders, MapPin, Check } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const SuperAdminScheduling = () => {
  const { schedulingConfig, updateSchedulingConfig } = useApp();

  const [northDays, setNorthDays] = useState(
    schedulingConfig?.northDays || ['Monday', 'Tuesday', 'Wednesday']
  );
  const [southDays, setSouthDays] = useState(
    schedulingConfig?.southDays || ['Thursday', 'Friday']
  );
  const [kushavatiDays, setKushavatiDays] = useState(
    schedulingConfig?.kushavatiDays || ['Saturday']
  );
  const [maxDailyBookings, setMaxDailyBookings] = useState(
    schedulingConfig?.maxDailyBookings || 15
  );
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (schedulingConfig) {
      if (schedulingConfig.northDays) setNorthDays(schedulingConfig.northDays);
      if (schedulingConfig.southDays) setSouthDays(schedulingConfig.southDays);
      if (schedulingConfig.kushavatiDays) setKushavatiDays(schedulingConfig.kushavatiDays);
      if (schedulingConfig.maxDailyBookings) setMaxDailyBookings(schedulingConfig.maxDailyBookings);
    }
  }, [schedulingConfig]);

  const toggleDay = (regionDays, setRegionDays, day) => {
    if (regionDays.includes(day)) {
      if (regionDays.length === 1) return; // Keep at least one day per region
      setRegionDays(regionDays.filter((d) => d !== day));
    } else {
      const updated = [...regionDays, day].sort(
        (a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b)
      );
      setRegionDays(updated);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateSchedulingConfig({
      northDays,
      southDays,
      kushavatiDays,
      maxDailyBookings: Number(maxDailyBookings)
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3500);
  };

  return (
    <div style={{ maxWidth: '980px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3>Taluka & Regional Scheduling Governance</h3>
        </div>
      </div>

      {savedNotice && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(47, 122, 77, 0.12)',
            color: 'var(--success)',
            borderRadius: '8px',
            border: '1px solid rgba(47, 122, 77, 0.3)',
            marginBottom: '20px',
            fontSize: '13.5px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={18} />
          Regional schedule configuration saved and applied to customer booking engine!
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {/* Card 1: North Goa Region */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <MapPin size={18} color="var(--teal)" />
              <h3 style={{ margin: 0, fontSize: '15.5px' }}>North Goa Region</h3>
            </div>
            <p className="cell-muted" style={{ fontSize: '12px', marginBottom: '14px', minHeight: '32px' }}>
              Bardez, Tiswadi, Bicholim, Sattari, Pernem.
            </p>

            <div className="field">
              <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                Toggle Allocated Service Days
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = northDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(northDays, setNorthDays, day)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: isSelected ? '1.5px solid var(--teal)' : '1px solid var(--line)',
                        background: isSelected ? 'rgba(31, 138, 130, 0.12)' : 'var(--paper)',
                        color: isSelected ? 'var(--teal)' : 'var(--ink-soft)'
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}{day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>

              <div style={{ background: 'var(--cream)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '12px' }}>
                Active: <b style={{ color: 'var(--teal-dark)' }}>{northDays.join(', ') || 'None'}</b>
              </div>
            </div>
          </Card>

          {/* Card 2: South Goa Region */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <MapPin size={18} color="var(--gold)" />
              <h3 style={{ margin: 0, fontSize: '15.5px' }}>South Goa Region</h3>
            </div>
            <p className="cell-muted" style={{ fontSize: '12px', marginBottom: '14px', minHeight: '32px' }}>
              Salcete, Mormugao, Ponda, Quepem, Sanguem, Canacona.
            </p>

            <div className="field">
              <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                Toggle Allocated Service Days
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = southDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(southDays, setSouthDays, day)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: isSelected ? '1.5px solid var(--gold)' : '1px solid var(--line)',
                        background: isSelected ? 'rgba(216, 163, 61, 0.14)' : 'var(--paper)',
                        color: isSelected ? '#8a6a1f' : 'var(--ink-soft)'
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}{day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>

              <div style={{ background: 'var(--cream)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '12px' }}>
                Active: <b style={{ color: '#8a6a1f' }}>{southDays.join(', ') || 'None'}</b>
              </div>
            </div>
          </Card>

          {/* Card 3: Kushavati Region */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <MapPin size={18} color="var(--amber)" />
              <h3 style={{ margin: 0, fontSize: '15.5px' }}>Kushavati Region</h3>
            </div>
            <p className="cell-muted" style={{ fontSize: '12px', marginBottom: '14px', minHeight: '32px' }}>
              Dedicated agricultural & river basin agricultural territory.
            </p>

            <div className="field">
              <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                Toggle Allocated Service Days
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = kushavatiDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(kushavatiDays, setKushavatiDays, day)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: isSelected ? '1.5px solid var(--amber)' : '1px solid var(--line)',
                        background: isSelected ? 'rgba(199, 112, 42, 0.14)' : 'var(--paper)',
                        color: isSelected ? 'var(--amber)' : 'var(--ink-soft)'
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}{day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>

              <div style={{ background: 'var(--cream)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '12px' }}>
                Active: <b style={{ color: 'var(--amber)' }}>{kushavatiDays.join(', ') || 'None'}</b>
              </div>
            </div>
          </Card>
        </div>

        <Card style={{ marginTop: '20px' }}>
          <h3>Platform Capacity & Dispatch Limits</h3>
          <div className="field" style={{ maxWidth: '320px', marginTop: '14px' }}>
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
            <Button variant="primary" icon={Save} type="submit" size="lg">
              Save Scheduling Settings
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
