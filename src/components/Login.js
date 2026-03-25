import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Matching your @GetMapping("/login") with @RequestParam
            const loginResponse = await axios.get(`http://localhost:8083/user/login`, {
                params: { email, password }
            });

            const loginData = loginResponse.data;
            setMsg(typeof loginData === 'string' ? loginData : 'Login successful');

            if (typeof loginData === 'string' && loginData.toLowerCase().includes('successful')) {
                // Optionally persist logged-in user and go to dashboard
                if (loginResponse.data.user) {
                    localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
                } else {
                    localStorage.setItem('user', JSON.stringify({ email }));
                }

                // After successful login, fetch all users and move to dashboard
                const getAllResp = await axios.get(`http://localhost:8083/user/getAll`);
                const users = Array.isArray(getAllResp.data) ? getAllResp.data : [];
                localStorage.setItem('allUsers', JSON.stringify(users));

                // Persist the logged-in user with full profile from all users (if available)
                const matchedUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
                if (matchedUser) {
                    localStorage.setItem('user', JSON.stringify(matchedUser));
                } else if (loginResponse.data.user) {
                    localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
                } else {
                    localStorage.setItem('user', JSON.stringify({ email }));
                }

                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
            setMsg("Login Failed. Please check your credentials.");
        }
    };

    return (
        <div className="auth-container">
            <h2>Welcome Back</h2>
            <form onSubmit={handleLogin}>
                <div className="input-group">
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="input-group">
                    <label>Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit">Login</button>
            </form>
            {msg && <div className={`message ${msg.includes("Failed") ? 'error' : 'success'}`}>{msg}</div>}

            <p className="toggle-link">
                Don't have an account? <span onClick={() => navigate('/signup')}>Sign Up</span>
            </p>
        </div>
    );
};

export default Login;