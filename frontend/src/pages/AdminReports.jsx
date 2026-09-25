import React from 'react';
import { useApp } from '../context/AppContext';
import { normalizeTaluka } from '../utils/helpers';
import { Card } from '../components/common/Card';

export const AdminReports = () => {
  const { bookings, services } = useApp();

  const completed = bookings.filter((b) => b.status === 'completed');
  const totalRev = completed.reduce(
    (sum, b) => sum + Number(b.actual_amount || b.quote_amount || 0),
    0
  );
  const avgJobValue = completed.length > 0 ? Math.round(totalRev / completed.length) : 0;

  // Monthly trends simulation
  const months = ['May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26'];
  const revenues = [42500, 68900, 94200, 118400, 142600];
  const maxRev = Math.max(...revenues);

  // Volume by Standard Talukas (North Goa, South Goa, Kushavati)
  const talukaCounts = {
    'North Goa': 0,
    'South Goa': 0,
    'Kushavati': 0
  };
  bookings.forEach((b) => {
    const t = normalizeTaluka(b.taluka);
    talukaCounts[t] = (talukaCounts[t] || 0) + 1;
  });
  const maxTaluka = Math.max(1, ...Object.values(talukaCounts));

  return (
    <div>
      <div className="two-col">
        <Card>
          <h3>Monthly Platform Revenue Growth</h3>
          <p className="cell-muted" style={{ marginBottom: '16px' }}>
            Total billed value from completed harvesting & tree care bookings.
          </p>
          <div>
            {months.map((m, idx) => {
              const val = revenues[idx];
              const pct = Math.round((val / maxRev) * 100);
              return (
                <div key={m} className="bar-row">
                  <div className="lbl">{m}</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        background: 'linear-gradient(90deg, var(--gold), var(--gold-light))',
                        width: `${pct}%`
                      }}
                    />
                  </div>
                  <div className="bar-val">₹{val.toLocaleString('en-IN')}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3>Service Demand by Taluka</h3>
          <p className="cell-muted" style={{ marginBottom: '16px' }}>
            Geographic distribution of customer bookings across Goa.
          </p>
          <div>
            {Object.entries(talukaCounts).map(([taluka, count]) => {
              const pct = Math.round((count / maxTaluka) * 100);
              return (
                <div key={taluka} className="bar-row">
                  <div className="lbl">{taluka}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="bar-val">{count} bookings</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: '20px' }}>
        <h3>Platform Performance Summary</h3>
        <div className="two-col" style={{ marginTop: '14px' }}>
          <div>
            <div className="kpi-line">
              <span>Total Bookings Recorded</span>
              <b>{bookings.length} jobs</b>
            </div>
            <div className="kpi-line">
              <span>Completed & Verified Jobs</span>
              <b>{completed.length}</b>
            </div>
            <div className="kpi-line">
              <span>Fulfillment Completion Rate</span>
              <b>{bookings.length > 0 ? Math.round((completed.length / bookings.length) * 100) : 0}%</b>
            </div>
          </div>
          <div>
            <div className="kpi-line">
              <span>Total Revenue Realized</span>
              <b>₹{totalRev.toLocaleString('en-IN')}</b>
            </div>
            <div className="kpi-line">
              <span>Average Job Ticket Value</span>
              <b>₹{avgJobValue.toLocaleString('en-IN')}</b>
            </div>
            <div className="kpi-line">
              <span>Customer Satisfaction Index</span>
              <b style={{ color: 'var(--gold)' }}>★ 4.8 / 5.0</b>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
