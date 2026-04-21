import React, { useState } from 'react';
import { MapPin, Truck, CheckCircle2 } from 'lucide-react';

const NGODashboard = () => {
  const [feed, setFeed] = useState([
    { id: 101, donor: 'City Bakery', foodType: 'Baked Goods', quantity: '20 loaves', state: 'Fresh', location: '123 Main St', distance: '1.2 km', time: 'Avoid 5PM rush' },
    { id: 102, donor: 'Grand Hotel', foodType: 'Buffet Rice', quantity: '100 servings', state: 'Near Expiry', location: '45 Hotel Ave', distance: '3.4 km', time: 'Urgent' },
    { id: 103, donor: 'Fresh Mart', foodType: 'Rotten Veggies', quantity: '15 kg', state: 'Expired', location: '99 Market Rd', distance: '2.0 km', time: 'For Compost/Animals' },
  ]);

  const [accepted, setAccepted] = useState([]);

  const handleAccept = (request) => {
    setFeed(feed.filter(item => item.id !== request.id));
    setAccepted([...accepted, request]);
  };

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <h2>NGO Portal</h2>
        <p>Real-time feed of available surplus food donations in your sector.</p>
      </div>

      <div className="ngo-grid">
        <div className="feed-column">
          <h3 className="section-title">Available Donations</h3>
          {feed.length === 0 ? (
            <p className="empty-state">No donations currently available in your area. Waiting for donors...</p>
          ) : (
            feed.map((req) => (
              <div key={req.id} className="request-card">
                <div className="request-header">
                  <h4>{req.donor}</h4>
                  <span className={`badge state-${req.state.replace(' ', '-').toLowerCase()}`}>
                      {req.state}
                  </span>
                </div>
                
                <h2 className="food-title">{req.foodType}</h2>
                <div className="request-details">
                  <span><strong>Qty:</strong> {req.quantity}</span>
                  <span><MapPin size={14}/> {req.location} ({req.distance})</span>
                </div>
                <div className="pickup-info">
                  <strong>Pickup Instruction:</strong> {req.time}
                </div>
                
                <button className="btn btn-primary full-width" onClick={() => handleAccept(req)}>
                  <CheckCircle2 size={16}/> Accept & Schedule Pickup
                </button>
              </div>
            ))
          )}
        </div>

        <div className="active-pickups-column">
          <div className="card list-card">
            <div className="card-header">
              <Truck className="card-icon" />
              <h3>My Scheduled Pickups</h3>
            </div>
            <div className="donations-list">
              {accepted.length === 0 ? (
                <p className="empty-state">No pickups scheduled yet.</p>
              ) : (
                accepted.map((item) => (
                  <div key={item.id} className="donation-item pickup-item">
                    <div className="donation-info">
                      <h4>{item.donor}</h4>
                      <span><MapPin size={12}/> {item.location}</span>
                    </div>
                    <span className="badge in-transit">In Progress</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGODashboard;
