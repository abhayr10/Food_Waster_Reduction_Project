import React, { useState, useEffect } from 'react';
import { Leaf, MapPin, Truck, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NGODashboard = () => {
  const { user } = useAuth();
  const [pendingDonations, setPendingDonations] = useState([]);
  const [acceptedDonations, setAcceptedDonations] = useState([]);

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/donations/ngo/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setPendingDonations(data.donations.filter(d => d.status === 'Pending'));
        setAcceptedDonations(data.donations.filter(d => d.status === 'Accepted' || d.status === 'Completed' || d.status === 'Confirmed'));
      }
    } catch (error) {
      console.error("Failed to fetch donations", error);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      fetchDonations();
    }
  }, [user]);

  const handleAccept = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/donations/${id}/accept`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ngo_id: user.id })
      });
      if (response.ok) {
        alert("Surplus food successfully accepted!");
        fetchDonations();
      } else {
        const errorData = await response.json();
        alert("Failed to accept: " + (errorData.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error accepting donation", error);
      alert("Could not connect to the server.");
    }
  };

  const handleComplete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/donations/${id}/complete`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      if (response.ok) {
        alert("Request marked as correctly picked up!");
        fetchDonations();
      } else {
        const errorData = await response.json();
        alert("Failed to mark as picked up: " + (errorData.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error completing pickup", error);
      alert("Could not connect to the server.");
    }
  };

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <h2>NGO Dashboard</h2>
        <p>Browse available food donations and manage your pickups.</p>
      </div>

      <div className="donor-grid" style={{ gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)' }}>
        <div className="card list-card">
          <div className="card-header">
            <Leaf className="card-icon" />
            <h3>Available Requests</h3>
          </div>
          <div className="donations-list">
            {pendingDonations.length === 0 ? (
              <p className="empty-state">No pending requests right now.</p>
            ) : (
              pendingDonations.map(req => (
                <div key={req.id} className="donation-item" style={{ flexWrap: 'wrap' }}>
                  <div className="donation-info" style={{ flex: '1 1 100%' }}>
                    <h4>{req.foodType}</h4>
                    <span className="qty" style={{ display: 'block', fontSize: '0.9rem', color: '#666' }}>{req.quantity} • by {req.donorName}</span>
                    <span className="qty" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}><MapPin size={14}/> {req.location}</span>
                    <span className="qty" style={{ display: 'block', fontSize: '0.85rem' }}>Expires: {req.expiryDate}</span>
                    <span className="qty" style={{ display: 'block', fontSize: '0.85rem' }}>Pickup By: {req.pickupTime}</span>
                  </div>
                  <div className="badges" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'space-between' }}>
                    <span className={`badge state-${req.expiryState.replaceAll(' ', '-').toLowerCase()}`}>{req.expiryState}</span>
                    <button className="btn btn-primary btn-sm" onClick={() => handleAccept(req.id)}>Accept Request</button>
                  </div>
                  {req.expiryState === 'Compost Only' && (
                    <div style={{ color: '#d32f2f', fontWeight: 'bold', marginTop: '0.5rem', fontSize: '0.85rem', width: '100%' }}>
                      ⚠️ URGENT: Severely expired. Do NOT use for animal feed. Compost only.
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card list-card">
          <div className="card-header">
            <Truck className="card-icon" />
            <h3>My Accepted Pickups</h3>
          </div>
          <div className="donations-list">
            {acceptedDonations.length === 0 ? (
               <p className="empty-state">You haven't accepted any requests yet.</p>
            ) : (
              acceptedDonations.map(req => (
                <div key={req.id} className="donation-item" style={{ flexWrap: 'wrap', borderLeft: req.status === 'Completed' || req.status === 'Confirmed' ? '4px solid var(--primary)' : '4px solid var(--secondary)' }}>
                  <div className="donation-info" style={{ flex: '1 1 100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0 }}>{req.foodType}</h4>
                      <span className={`badge status-${req.status.toLowerCase()}`}>{req.status}</span>
                    </div>
                    <span className="qty" style={{ display: 'block', fontSize: '0.9rem', color: '#666' }}>{req.quantity} • from {req.donorName} {(req.status === 'Accepted' || req.status === 'Completed' || req.status === 'Confirmed') && req.donorPhone ? `• Tel: ${req.donorPhone}` : ''}</span>
                    <span className="qty" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}><MapPin size={14}/> {req.location}</span>
                    <span className="qty" style={{ display: 'block', fontSize: '0.85rem' }}>Pickup Expected: {req.pickupTime}</span>
                  </div>
                  {req.status === 'Accepted' && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ marginTop: '0.5rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                      onClick={() => handleComplete(req.id)}
                    >
                      <CheckCircle size={16} /> Mark as Picked Up
                    </button>
                  )}
                  {req.status === 'Confirmed' && (
                    <p style={{ marginTop: '0.5rem', width: '100%', textAlign: 'center', color: 'var(--primary-dark)', fontSize: '0.85rem' }}>
                       Pickup officially verified by donor!
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGODashboard;
