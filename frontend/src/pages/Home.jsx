import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  
  return (
    <div className="home-page fade-in">
      <div className="hero-section">
        <h1>Bridge the Gap Between Surplus Food and Hunger.</h1>
        <p className="hero-subtitle">
          Join our decentralized platform connecting restaurants, event organizers, and individuals directly with NGOs who can redistribute food to those in need.
        </p>
        <div className="hero-actions">
          <Link to={user && user.role === 'donor' ? '/donor' : '/register?role=donor'} className="btn btn-primary">
            I Want to Donate <ArrowRight size={18} />
          </Link>
          <Link to={user && user.role === 'ngo' ? '/ngo' : '/register?role=ngo'} className="btn btn-secondary">
            I am an NGO
          </Link>
        </div>
      </div>

      <div className="features-section">
        <div className="feature-card">
          <div className="icon-wrapper"><Leaf size={32} /></div>
          <h3>Eco-Friendly</h3>
          <p>We classify surplus food into Fresh, Near-Expiry, and Expired so it can be donated safely or composted for sustainability.</p>
        </div>
        <div className="feature-card">
          <div className="icon-wrapper"><HeartHandshake size={32} /></div>
          <h3>Community First</h3>
          <p>Real-time coordination helps NGOs secure pickups faster, maximizing the amount of edible food that stays out of landfills.</p>
        </div>
        <div className="feature-card">
          <div className="icon-wrapper"><ShieldCheck size={32} /></div>
          <h3>Safe Tracking</h3>
          <p>Clear expiry time tracking and verified portals ensure that all donated goods meet proper health and safety standards.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
