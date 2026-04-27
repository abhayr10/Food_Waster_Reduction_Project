import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const location = useLocation();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'donor', phone: '' });
    const [error, setError] = useState('');
    const [isVerificationPhase, setIsVerificationPhase] = useState(false);
    const [otp, setOtp] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const roleParam = queryParams.get('role');
        if (roleParam === 'donor' || roleParam === 'ngo') {
            setFormData((prev) => ({ ...prev, role: roleParam }));
        }
    }, [location]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.requires_verification) {
                    setIsVerificationPhase(true);
                } else {
                    login(data.user);
                    navigate(data.user.role === 'donor' ? '/donor' : '/ngo');
                }
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Could not connect to the server');
        }
    };
    
    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('/api/auth/verify_otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp }),
            });
            const data = await response.json();
            if (response.ok) {
                login(data.user);
                navigate(data.user.role === 'donor' ? '/donor' : '/ngo');
            } else {
                setError(data.message || 'Verification failed');
            }
        } catch (err) {
            setError('Could not connect to verify');
        }
    };

    return (
        <div className="home-page fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card form-card" style={{ maxWidth: '400px', width: '100%' }}>
                <div className="card-header">
                    <h3>{isVerificationPhase ? "Enter Verification Code" : "Create an Account"}</h3>
                </div>
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                
                {isVerificationPhase ? (
                    <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                        <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>We sent a 6-digit code to <b>{formData.email}</b>. Check your email (or terminal!).</p>
                        <div className="form-group">
                            <label>Verification Code</label>
                            <input
                                type="text"
                                name="otp"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary submit-btn">Verify & Login</button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                        <div className="form-group">
                            <label>Full Name or Organization Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="John Doe / Example NGO"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="mail@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="+1 234 567 890"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Create a secure password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Account Type</label>
                            <select name="role" value={formData.role} onChange={handleChange} required>
                                <option value="donor">I want to donate food (Donor)</option>
                                <option value="ngo">I am an NGO distributing food</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary submit-btn">Register</button>
                        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Login Here</Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Register;
