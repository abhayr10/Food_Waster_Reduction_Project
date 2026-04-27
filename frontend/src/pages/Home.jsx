import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Leaderboard from '../components/Leaderboard';
import heroImg from '../assets/hero.png'; // Restored your image import!

const Home = () => {
  const { user } = useAuth();
  
  return (
    <div className="home-page fade-in">
      
      {/* 1. Hero Section - Restored to side-by-side layout */}
      <div className="hero-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Left Side: Text and Buttons */}
        <div className="hero-content" style={{ flex: '1 1 500px' }}>
          <h1>Bridge the Gap Between Surplus Food and Hunger.</h1>
          <p className="hero-subtitle">
            Join our decentralized platform connecting restaurants, event organizers, and individuals directly with NGOs who can redistribute food to those in need.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to={user.role === 'donor' ? '/donor' : '/ngo'} className="btn btn-primary">
                Go to My Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register?role=donor" className="btn btn-primary">
                  I Want to Donate <ArrowRight size={18} />
                </Link>
                <Link to="/register?role=ngo" className="btn btn-secondary">
                  I am an NGO
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Circular Hero Image from your screenshot */}
        <div className="hero-image-container" style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
          <img 
            src={heroImg} 
            alt="Surplus Food" 
            style={{ width: '100%', maxWidth: '400px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} 
          />
        </div>

      </div>

      {/* 2. Features Section - Completely untouched so your CSS works perfectly */}
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

      {/* 3. Leaderboard safely added at the bottom */}
      <div className="leaderboard-wrapper" style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid #eaeaea' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#333' }}>Our Community Impact</h2>
        <Leaderboard />
      </div>

    </div>
  );
};

export default Home;