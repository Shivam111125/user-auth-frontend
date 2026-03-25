import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [emailModal, setEmailModal] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [editModal, setEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editAmount, setEditAmount] = useState('');
    
    // 1. Default state empty rakha hai taaki "Select Mode" dikhe
    const [editPaymentMode, setEditPaymentMode] = useState(''); 

    const [historyModal, setHistoryModal] = useState(false);
    const [userHistory, setUserHistory] = useState([]);
    const [totals, setTotals] = useState({}); 

    const [selectedUsers, setSelectedUsers] = useState([]);
    const navigate = useNavigate();
    const BACKEND_URL = 'http://localhost:8083';

    const fetchUserTotal = useCallback(async (userId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`${BACKEND_URL}/user/${userId}/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const history = res.data || [];
            const sum = history.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
            return sum;
        } catch (err) { return 0; }
    }, [BACKEND_URL]);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const savedAllUsers = localStorage.getItem('allUsers');

        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            navigate('/');
            return;
        }

        if (savedAllUsers) {
            try {
                const parsedUsers = JSON.parse(savedAllUsers);
                setAllUsers(parsedUsers);
                parsedUsers.forEach(async (u) => {
                    const total = await fetchUserTotal(u.id);
                    setTotals(prev => ({ ...prev, [u.id]: total }));
                });
            } catch (err) { setAllUsers([]); }
        }
    }, [navigate, fetchUserTotal]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleSelectUser = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === allUsers.length) {
            setSelectedUsers([]); 
        } else {
            const allIds = allUsers.map(u => u.id);
            setSelectedUsers(allIds); 
        }
    };

    const handleExport = async (format) => {
        if (selectedUsers.length === 0) {
            alert("Please select at least one user");
            return;
        }
        const token = localStorage.getItem('token');
        const endpoint = format === 'excel' ? '/api/export/excel' : '/api/export/pdf';
        const fileExtension = format === 'excel' ? 'xlsx' : 'pdf';
        const contentType = format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf';
        
        try {
            const res = await axios.post(`${BACKEND_URL}${endpoint}`, selectedUsers, { 
                responseType: 'blob',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const fileURL = URL.createObjectURL(new Blob([res.data], { type: contentType }));
            const link = document.createElement('a');
            link.href = fileURL;
            link.setAttribute('download', `Users_Report_${new Date().getTime()}.${fileExtension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(fileURL);
        } catch (error) {
            alert(`${format.toUpperCase()} download failed.`);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure?')) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${BACKEND_URL}/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
            const updated = allUsers.filter(u => u.id !== userId);
            setAllUsers(updated);
            localStorage.setItem('allUsers', JSON.stringify(updated));
        } catch (error) { alert('Delete failed'); }
    };

    // 2. Open Modal logic - Resetting values
    const openEditModal = (userItem) => {
        setEditingUser(userItem);
        setEditName(userItem.userName || userItem.name || '');
        setEditEmail(userItem.email || '');
        setEditAmount(''); 
        setEditPaymentMode(''); // Default to Select Mode
        setEditModal(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const updatedUser = { 
                ...editingUser, 
                name: editName, 
                email: editEmail, 
                advanceAmount: editAmount,
                paymentMode: editPaymentMode 
            };
            
            await axios.put(`${BACKEND_URL}/user/update/${editingUser.id}`, updatedUser, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            
            const updatedList = allUsers.map(u => u.id === editingUser.id ? { ...u, name: editName, email: editEmail } : u);
            setAllUsers(updatedList);
            localStorage.setItem('allUsers', JSON.stringify(updatedList));
            
            const newTotal = await fetchUserTotal(editingUser.id);
            setTotals(prev => ({ ...prev, [editingUser.id]: newTotal }));
            setEditModal(false);
            alert('Updated Successfully!');
        } catch (error) { alert('Update failed'); }
    };

    const openHistoryModal = async (userId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`${BACKEND_URL}/user/${userId}/history`, { headers: { Authorization: `Bearer ${token}` } });
            setUserHistory(response.data.reverse());
            setHistoryModal(true);
        } catch (error) { alert('History fetch failed'); }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="dashboard-page">
            {/* 3. CSS to hide number arrows (spin buttons) */}
            <style>
                {`
                    input::-webkit-outer-spin-button,
                    input::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    input[type=number] {
                        -moz-appearance: textfield;
                    }
                `}
            </style>

            <div className="dashboard-container">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <h2>Welcome, {user.userName || user.name}!</h2>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <button onClick={() => handleExport('pdf')} className="export-pdf-btn" style={{backgroundColor: '#27ae60', color: 'white', padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>
                            📄 Export PDF ({selectedUsers.length})
                        </button>
                        <button onClick={() => handleExport('excel')} className="export-excel-btn" style={{backgroundColor: '#2980b9', color: 'white', padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>
                            📊 Export Excel ({selectedUsers.length})
                        </button>
                    </div>
                </div>
                
                <div className="all-users">
                    <table>
                        <thead>
                            <tr>
                                <th style={{width: '60px', textAlign: 'center'}}>
                                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px'}}>
                                        <input type="checkbox" onChange={handleSelectAll} checked={allUsers.length > 0 && selectedUsers.length === allUsers.length} style={{cursor: 'pointer', width: '18px', height: '18px'}} />
                                        <span>Select All</span>
                                    </div>
                                </th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Actions</th>
                                <th>Total Advance</th>
                                <th>History</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers.map((userItem) => (
                                <tr key={userItem.id}>
                                    <td style={{textAlign: 'center'}}>
                                        <input type="checkbox" checked={selectedUsers.includes(userItem.id)} onChange={() => handleSelectUser(userItem.id)} style={{width: '18px', height: '18px', cursor: 'pointer'}} />
                                    </td>
                                    <td>{userItem.userName || userItem.name || '-'}</td>
                                    <td onClick={() => {setSelectedEmail(userItem.email); setEmailModal(true);}} style={{ cursor: 'pointer', color: '#2575fc', textDecoration: 'underline' }}>
                                        {userItem.email}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="edit-btn" onClick={() => openEditModal(userItem)}>Edit</button>
                                            <button className="delete-btn" onClick={() => handleDeleteUser(userItem.id)}>Delete</button>
                                        </div>
                                    </td>
                                    <td style={{fontWeight:'bold', color: '#2ecc71'}}>₹{totals[userItem.id] ?? '...'}</td>
                                    <td>
                                        <button className="history-btn" style={{backgroundColor: '#6c5ce7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer'}} onClick={() => openHistoryModal(userItem.id)}>
                                            View History
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button onClick={handleLogout} style={{marginTop: '20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer'}}>Logout</button>

                {/* Email Modal */}
                {emailModal && (
                    <div className="email-modal">
                        <div className="email-modal-content">
                            <div className="email-modal-header"><h3>Send Email</h3><button className="close-btn" onClick={() => setEmailModal(false)}>×</button></div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData();
                                formData.append('toMail', selectedEmail);
                                formData.append('fromMail', user.email);
                                formData.append('text', message);
                                formData.append('subject', subject);
                                if (file) formData.append('file', file);
                                axios.post(`${BACKEND_URL}/api/sendMail`, formData).then(() => { alert('Sent!'); setEmailModal(false); });
                            }}>
                                <div className="form-group"><label>Subject:</label><input type="text" onChange={(e)=>setSubject(e.target.value)} required /></div>
                                <div className="form-group"><label>Message:</label><textarea onChange={(e)=>setMessage(e.target.value)} rows="6" required></textarea></div>
                                <div className="form-group"><label>Attachment:</label><input type="file" onChange={(e)=>setFile(e.target.files[0])} /></div>
                                <button type="submit" className="send-btn">Send</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {editModal && (
                    <div className="email-modal">
                        <div className="email-modal-content">
                            <div className="email-modal-header">
                                <h3>Edit User & Add Advance</h3>
                                <button className="close-btn" onClick={() => setEditModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleUpdateUser}>
                                <div className="form-group">
                                    <label>Name:</label>
                                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                                </div>
                                
                                <div className="form-group">
                                    <label>Email:</label>
                                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                                </div>

                                <div className="form-group">
                                    <label>Advance Amount & Mode:</label>
                                    <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                                        <input 
                                            type="number" 
                                            placeholder="Amount"
                                            value={editAmount} 
                                            onChange={(e) => setEditAmount(e.target.value)} 
                                            style={{ flex: '2', border: 'none', padding: '10px', outline: 'none' }}
                                            required 
                                        />
                                        <select 
                                            value={editPaymentMode} 
                                            onChange={(e) => setEditPaymentMode(e.target.value)} 
                                            style={{ flex: '1.2', borderLeft: '1px solid #ddd', borderRight: 'none', borderTop: 'none', borderBottom: 'none', backgroundColor: '#f9f9f9', padding: '5px', cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
                                            required
                                        >
                                            <option value="" disabled hidden>Select Payment Mode</option>
                                            <option value="Paytm">Paytm</option>
                                            <option value="PhonePe">PhonePe</option>
                                            <option value="GooglePay">GooglePay</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="WhatsAppPay">WhatsAppPay</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <button type="submit" className="send-btn" style={{ width: '100%', marginTop: '10px' }}>
                                    Update User
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* History Modal */}
                {historyModal && (
                    <div className="email-modal">
                        <div className="email-modal-content" style={{maxWidth: '650px'}}>
                            <div className="email-modal-header">
                                <h3 style={{margin:0}}>📊 Payment History</h3>
                                <button className="close-btn" onClick={() => setHistoryModal(false)}>×</button>
                            </div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '15px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                                        <tr>
                                            <th style={{padding:'12px', textAlign:'left', borderBottom: '2px solid #ddd'}}>Date</th>
                                            <th style={{padding:'12px', textAlign:'left', borderBottom: '2px solid #ddd'}}>Amount</th>
                                            <th style={{padding:'12px', textAlign:'center', borderBottom: '2px solid #ddd'}}>Payment Mode</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userHistory.map((h, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{padding:'12px', color: '#444'}}>{h.date || 'N/A'}</td>
                                                <td style={{padding:'12px', fontWeight:'bold'}}>₹{h.amount || h.advanceAmount}</td>
                                                <td style={{padding:'12px', textAlign:'center'}}>
                                                    <span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '5px 12px', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', border: '1px solid #c8e6c9' }}>
                                                        {h.paymentMode || 'N/A'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;