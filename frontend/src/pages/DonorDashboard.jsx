import React, { useState, useEffect } from 'react';
import { PackagePlus, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BadgeShowcase from '../components/BadgeShowcase'; // Added Import

const DonorDashboard = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [formData, setFormData] = useState({
    foodType: '',
    quantity: '',
    location: '',
    expiryState: 'Fresh',
    expiryDate: '',
    pickupTime: ''
  });

  const fetchDonations = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/donations/donor/${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setDonations(data.donations);
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

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const calculateExpiryState = (expiryDateString) => {
    const now = new Date();
    const expiry = new Date(expiryDateString);
    const diffHours = (expiry - now) / (1000 * 60 * 60);

    if (diffHours > 48) return 'Fresh';
    if (diffHours > 0) return 'Near Expiry';
    if (diffHours >= -24) return 'Safe for Animal Feed';
    return 'Compost Only';
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!formData.foodType || !formData.quantity || !formData.expiryDate || !formData.location || !formData.pickupTime) {
      alert("Please fill in all required fields, including Expiry Date, Location, and Pickup Time.");
      return;
    }
    
    const computedExpiryState = calculateExpiryState(formData.expiryDate);

    try {
      const response = await fetch('http://localhost:5000/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_id: user.id,
          food_type: formData.foodType,
          quantity: formData.quantity,
          location: formData.location,
          expiry_state: computedExpiryState,
          expiry_date: formData.expiryDate,
          pickup_time: formData.pickupTime
        })
      });

      if (response.ok) {
        alert("Donation request submitted successfully! Classified as: " + computedExpiryState);
        setFormData({
          foodType: '', quantity: '', location: '', expiryDate: '', pickupTime: ''
        });
        fetchDonations();
      } else {
        const errorData = await response.json();
        alert("Failed to submit request: " + (errorData.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error creating donation", error);
      alert("Could not connect to the server. Is the backend running?");
    }
  };

  const handleConfirmPickup = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/donations/${id}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (response.ok) {
        alert("Pickup has been confirmed to be a success!");
        fetchDonations();
      } else {
        const errorData = await response.json();
        alert("Failed to confirm: " + (errorData.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error confirming pickup", error);
      alert("Could not connect to the server.");
    }
  };

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <h2>Donor Portal</h2>
        <p>Report surplus food to be collected by local NGOs.</p>
      </div>

      {/* Gamification Component Rendered Here */}
      {user && user.id && (
        <BadgeShowcase donorId={user.id} />
      )}

      <div className="donor-grid">
        <div className="card form-card">
          <div className="card-header">
            <PackagePlus className="card-icon" />
            <h3>Report Surplus Food</h3>
          </div>
          <form className="donation-form" onSubmit={handleDonate}>
            <div className="form-group">
              <label>Food Item / Type</label>
              <input type="text" name="foodType" placeholder="e.g., Rice & Lentils, Bread" value={formData.foodType} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label>Quantity</label>
              <input type="text" name="quantity" placeholder="e.g., 50 servings, 5 kg" value={formData.quantity} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Location / Address</label>
              <input type="text" name="location" placeholder="e.g., 123 Main Street" value={formData.location} onChange={handleChange} required />
            </div>

            <div className="row">
              <div className="form-group">
                <label>Exact Expiry Date & Time</label>
                <input type="datetime-local" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Preferred Pickup Time</label>
                <input type="time" name="pickupTime" value={formData.pickupTime} onChange={handleChange} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary submit-btn">Submit Donation Request</button>
          </form>
        </div>

        <div className="card list-card">
          <div className="card-header">
            <Clock className="card-icon" />
            <h3>My Active Listings</h3>
          </div>
          <div className="donations-list">
            {donations.length === 0 ? (
              <p className="empty-state">No active donations. Report surplus food to get started.</p>
            ) : (
              donations.map((item) => (
                <div key={item.id} className="donation-item" style={{ flexWrap: 'wrap' }}>
                  <div className="donation-info" style={{ flex: '1 1 100%' }}>
                    <h4>{item.foodType}</h4>
                    <span className="qty" style={{ display: 'block', fontSize: '0.9rem', color: '#666' }}>{item.quantity}</span>
                    <span className="qty" style={{ display: 'block', fontSize: '0.85rem' }}>Expires: {item.expiryDate}</span>
                    {item.ngoName && <span className="qty" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary-dark)' }}>NGO: {item.ngoName} {item.ngoPhone && `• Tel: ${item.ngoPhone}`}</span>}
                  </div>
                  <div className="badges" style={{ marginTop: '0.5rem' }}>
                    <span className={`badge state-${item.expiryState.replaceAll(' ', '-').toLowerCase()}`}>
                      {item.expiryState}
                    </span>
                    <span className={`badge status-${item.status.toLowerCase()}`}>{item.status}</span>
                  </div>
                  {item.expiryState === 'Compost Only' && (
                    <div style={{ color: '#d32f2f', fontWeight: 'bold', marginTop: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      ⚠️ URGENT: Severely expired. Do NOT use for animal feed. Compost only.
                    </div>
                  )}
                  {item.status === 'Completed' && (
                    <button 
                      className="btn btn-primary" 
                      style={{ marginTop: '0.5rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                      onClick={() => handleConfirmPickup(item.id)}
                    >
                      <CheckCircle size={16} /> Confirm Pickup Success
                    </button>
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

export default DonorDashboard;