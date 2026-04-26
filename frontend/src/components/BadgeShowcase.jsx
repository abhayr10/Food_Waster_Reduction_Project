import React, { useState, useEffect } from 'react';
import { Medal, ShieldCheck, Loader2 } from 'lucide-react';

const iconMap = {
  Medal: Medal,
  ShieldCheck: ShieldCheck,
};

const BadgeShowcase = ({ donorId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!donorId) return;

    const fetchStats = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/donations/donor/${donorId}/stats`);
        const data = await response.json();
        if (response.ok && data.status === 'Success') {
          setStats(data.stats);
        } else {
          setError(data.message || 'Failed to load stats');
        }
      } catch (err) {
        setError('Could not connect to the server');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [donorId]);

  if (loading) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.5rem' }}>
        <Loader2 className="animate-spin" size={20} />
        <span>Loading achievements...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '1rem', color: 'red', textAlign: 'center' }}>
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <div className="card-header">
        <Medal className="card-icon" />
        <h3>Your Impact & Achievements</h3>
      </div>
      <div style={{ padding: '1rem' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          <strong>Completed Donations:</strong> {stats.completedDonations}
        </p>
        {stats.badges && stats.badges.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {stats.badges.map((badge) => {
              const IconComponent = iconMap[badge.icon] || Medal;
              return (
                <div
                  key={badge.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <IconComponent className={badge.color} size={24} />
                  <div>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>{badge.name}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: '#64748b', fontStyle: 'italic' }}>
            No badges yet. Complete your first donation to earn one!
          </p>
        )}
      </div>
    </div>
  );
};

export default BadgeShowcase;

