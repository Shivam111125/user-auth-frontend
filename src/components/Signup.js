import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'USER' // Default role
        // mobile: ''
    });
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            // Matching your @PostMapping("/signup") with @RequestBody
            const response = await axios.post('http://localhost:8083/user/signup', formData);
            setMsg(response.data);
            setTimeout(() => navigate('/'), 2000);
        } catch (error) {
            setMsg("Signup Failed. Try again.");
        }
    };

    return (
        <div className="auth-container">
            <h2>Create Account</h2>
            <form onSubmit={handleSignup}>
                <div className="input-group">
                    <label>Full Name</label>
                    <input type="text" onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="input-group">
                    <label>Email</label>
                    <input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
                {/* <div className="input-group">
                    <label>Mobile</label>
                    <input type="text" onChange={(e) => setFormData({...formData, mobile: e.target.value})} required />
                </div> */}
                <div className="input-group">
                    <label>Password</label>
                    <input type="password" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                </div>
                <button type="submit" style={{background: 'linear-gradient(to right, #00b09b, #96c93d)'}}>Sign Up</button>
            </form>
            {msg && <div className="message success">{msg}</div>}
            <p className="toggle-link">
                Already have an account? <span onClick={() => navigate('/')}>Login</span>
            </p>
        </div>
    );
};

export default Signup;