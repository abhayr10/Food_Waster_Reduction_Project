import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Utensils, Heart, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getNavLinkClass = (path) => {
    return location.pathname === path 
      ? "nav-link active" 
      : "nav-link";
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <Utensils className="brand-icon" />
          <span>FoodRescue</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={getNavLinkClass('/')}>
            Home
          </Link>
          
          {user ? (
            <>
              {user.role === 'donor' && (
                <Link to="/donor" className={getNavLinkClass('/donor')}>
                  <Heart size={18} /> Donor Portal
                </Link>
              )}
              {user.role === 'ngo' && (
                <Link to="/ngo" className={getNavLinkClass('/ngo')}>
                  <LayoutDashboard size={18} /> NGO Dashboard
                </Link>
              )}
              <button onClick={logout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={getNavLinkClass('/login')}>
                <User size={18} /> Login
              </Link>
              <Link to="/register" className={getNavLinkClass('/register')}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
