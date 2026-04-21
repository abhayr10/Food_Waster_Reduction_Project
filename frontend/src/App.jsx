import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import DonorDashboard from './pages/DonorDashboard';
import NGODashboard from './pages/NGODashboard';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/donor" element={<DonorDashboard />} />
            <Route path="/ngo" element={<NGODashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
