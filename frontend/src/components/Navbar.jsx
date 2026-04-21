import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Utensils, Heart, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

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
          <Link to="/donor" className={getNavLinkClass('/donor')}>
            <Heart size={18} /> Donor Portal
          </Link>
          <Link to="/ngo" className={getNavLinkClass('/ngo')}>
            <LayoutDashboard size={18} /> NGO Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
