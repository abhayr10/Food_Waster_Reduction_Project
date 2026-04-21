import React, { useState } from 'react';
import { PackagePlus, Clock } from 'lucide-react';

const DonorDashboard = () => {
  const [donations, setDonations] = useState([
    { id: 1, foodType: 'Baked Goods', quantity: '20 loaves', status: 'Pending', expiryState: 'Fresh' }
  ]);

  const [formData, setFormData] = useState({
    foodType: '',
    quantity: '',
    location: '',
    expiryState: 'Fresh',
    pickupTime: ''
  });

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleDonate = (e) => {
    e.preventDefault();
    if (!formData.foodType || !formData.quantity) return;
    
    setDonations([
      { 
        id: donations.length + 1, 
        foodType: formData.foodType, 
        quantity: formData.quantity, 
        status: 'Pending',
        expiryState: formData.expiryState
      },
      ...donations
    ]);
    
    setFormData({...formData, foodType: '', quantity: '', pickupTime: ''});
  };

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <h2>Donor Portal</h2>
        <p>Report surplus food to be collected by local NGOs.</p>
      </div>

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
                <label>Food Condition (Critical)</label>
                <select name="expiryState" value={formData.expiryState} onChange={handleChange}>
                  <option value="Fresh">✅ Fresh Food</option>
                  <option value="Near Expiry">⚠️ Near Expiry</option>
                  <option value="Expired">❌ Expired (Send to Compost/Animal Shelter)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Pickup By</label>
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
                <div key={item.id} className="donation-item">
                  <div className="donation-info">
                    <h4>{item.foodType}</h4>
                    <span className="qty">{item.quantity}</span>
                  </div>
                  <div className="badges">
                    <span className={`badge state-${item.expiryState.replace(' ', '-').toLowerCase()}`}>
                      {item.expiryState}
                    </span>
                    <span className="badge pending">{item.status}</span>
                  </div>
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
