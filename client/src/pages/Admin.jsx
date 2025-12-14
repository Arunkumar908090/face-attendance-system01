import React, { useEffect, useState } from 'react';

function Admin() {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('logs');

    // Form inputs
    const [newSessionName, setNewSessionName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [bulkDate, setBulkDate] = useState('');

    useEffect(() => {
        fetchActiveSession();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'logs') fetchLogs();
        if (activeTab === 'sessions') fetchSessionHistory();
    }, [activeTab]);

    const fetchUsers = async () => {
        let url = '/api/users';
        if (searchQuery) url += `?search=${searchQuery}`;
        const res = await fetch(url);
        const data = await res.json();
        setUsers(data);
    };

    const fetchLogs = async () => {
        let url = '/api/attendance';
        if (searchQuery) url += `?search=${searchQuery}`;
        const res = await fetch(url);
        const data = await res.json();
        setLogs(data);
    };

    const fetchActiveSession = async () => {
        const res = await fetch('/api/sessions/active');
        const data = await res.json();
        setActiveSession(data);
    };

    const fetchSessionHistory = async () => {
        const res = await fetch('/api/sessions/history');
        const data = await res.json();
        setSessionHistory(data);
    };

    const createSession = async (type) => {
        if (!newSessionName) return alert("Please enter a session name");
        await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', name: newSessionName, type })
        });
        setNewSessionName('');
        fetchActiveSession();
        if (activeTab === 'sessions') fetchSessionHistory();
        alert(`${type === 'in' ? 'Sign In' : 'Sign Out'} Session Started!`);
    };

    const endSession = async (id) => {
        if (!window.confirm("End this session?")) return;
        await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle', id, isActive: false })
        });
        fetchActiveSession();
        if (activeTab === 'sessions') fetchSessionHistory();
    };

    const deleteSession = async (id) => {
        if (!window.confirm("Delete this session record?")) return;
        await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
        fetchSessionHistory();
    };

    const deleteUser = async (id) => {
        if (!window.confirm('Delete this user?')) return;
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
        fetchUsers();
    };

    const deleteLog = async (id) => {
        if (!window.confirm('Delete this record?')) return;
        await fetch(`/api/attendance/${id}`, { method: 'DELETE' });
        fetchLogs();
    };

    const deleteBulk = async () => {
        if (!bulkDate || !window.confirm(`Delete all logs for ${bulkDate}?`)) return;
        await fetch('/api/attendance/bulk', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: bulkDate })
        });
        setBulkDate('');
        fetchLogs();
    };

    const exportData = () => {
        window.open('http://localhost:3000/api/export', '_blank');
    };

    // Styling helpers
    const tabClass = (tab) => activeTab === tab ? 'btn btn-primary' : 'btn btn-secondary';
    const cellStyle = { padding: '0.8rem', borderBottom: '1px solid #333' };

    return (
        <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ marginBottom: '0.5rem', fontWeight: 800 }}>Admin Dashboard</h2>
                    {activeSession ? (
                        <div style={{ color: '#4ade80', background: '#22c55e22', padding: '4px 12px', borderRadius: '12px', display: 'inline-block', fontSize: '0.8rem' }}>
                            ● Active: {activeSession.name} ({activeSession.type.toUpperCase()})
                        </div>
                    ) : <span style={{ color: '#f87171' }}>● No Active Session</span>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className={tabClass('logs')} onClick={() => setActiveTab('logs')}>Logs</button>
                    <button className={tabClass('users')} onClick={() => setActiveTab('users')}>Users</button>
                    <button className={tabClass('sessions')} onClick={() => setActiveTab('sessions')}>Sessions</button>
                </div>
            </div>

            <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #333' }}>
                {activeTab === 'logs' && (
                    <div style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    placeholder="Search Name or Matric..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ padding: '0.5rem', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '6px' }}
                                />
                                <button className="btn btn-secondary" onClick={fetchLogs}>Search</button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', background: '#222', border: '1px solid #444', color: 'white' }} />
                                <button className="btn btn-secondary" style={{ background: '#7f1d1d', color: '#fca5a5' }} onClick={deleteBulk}>Clear Date</button>
                                <button className="btn btn-primary" onClick={exportData}>Export XLSX</button>
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead style={{ background: '#111', textTransform: 'uppercase', color: '#888' }}>
                                    <tr>
                                        <th style={cellStyle}>Photo</th>
                                        <th style={cellStyle}>Matric No</th>
                                        <th style={cellStyle}>Name</th>
                                        <th style={cellStyle}>Time</th>
                                        <th style={cellStyle}>Type</th>
                                        <th style={cellStyle}>Session</th>
                                        <th style={cellStyle}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id} style={{ transition: 'background 0.2s' }}>
                                            <td style={cellStyle}>
                                                {log.image ? <img src={log.image} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> : '-'}
                                            </td>
                                            <td style={cellStyle}>{log.matric_no || 'N/A'}</td>
                                            <td style={cellStyle}>
                                                <div>{log.name}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{log.department} - {log.level}</div>
                                            </td>
                                            <td style={cellStyle}>{new Date(log.timestamp).toLocaleString(undefined, { timeStyle: 'short', dateStyle: 'short' })}</td>
                                            <td style={cellStyle}>
                                                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', background: log.type === 'in' ? '#22c55e22' : '#f8717122', color: log.type === 'in' ? '#4ade80' : '#f87171' }}>
                                                    {log.type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={cellStyle}>{log.session_name}</td>
                                            <td style={cellStyle}>
                                                <button onClick={() => deleteLog(log.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div style={{ padding: '1rem' }}>
                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <input
                                placeholder="Search Users..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ padding: '0.5rem', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '6px', width: '300px' }}
                            />
                            <button className="btn btn-secondary" onClick={fetchUsers}>Search</button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead style={{ background: '#111', color: '#888' }}>
                                <tr>
                                    <th style={cellStyle}>Photo</th>
                                    <th style={cellStyle}>Matric No</th>
                                    <th style={cellStyle}>Name</th>
                                    <th style={cellStyle}>Details</th>
                                    <th style={cellStyle}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td style={cellStyle}>
                                            {user.photo ? <img src={user.photo} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 40, height: 40, background: '#333', borderRadius: '50%' }}></div>}
                                        </td>
                                        <td style={cellStyle}>{user.matric_no || 'N/A'}</td>
                                        <td style={cellStyle}>{user.name}</td>
                                        <td style={cellStyle}>{user.department} {user.level ? `(${user.level}L)` : ''}</td>
                                        <td style={cellStyle}>
                                            <button onClick={() => deleteUser(user.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'sessions' && (
                    <div style={{ padding: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            <div>
                                <h3 style={{ marginBottom: '1rem' }}>Create New Session</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <input
                                        placeholder="Session Name (e.g. MTH 101 Lecture)"
                                        value={newSessionName}
                                        onChange={e => setNewSessionName(e.target.value)}
                                        style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #444', background: '#111', color: 'white' }}
                                    />
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => createSession('in')}>Start SIGN IN</button>
                                        <button className="btn btn-secondary" style={{ flex: 1, border: '1px solid #f87171', color: '#f87171' }} onClick={() => createSession('out')}>Start SIGN OUT</button>
                                    </div>
                                    <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>Starting a new session will automatically end any currently active session.</p>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ marginBottom: '1rem' }}>Active Session</h3>
                                {activeSession ? (
                                    <div style={{ padding: '1.5rem', background: 'linear-gradient(45deg, #0f2e1a, #000)', borderRadius: '12px', border: '1px solid #22c55e' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{activeSession.name}</div>
                                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                            <span style={{ background: '#22c55e', color: 'black', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>ACTIVE</span>
                                            <span style={{ color: '#aaa' }}>Mode: {activeSession.type.toUpperCase()}</span>
                                        </div>
                                        <button className="btn btn-secondary" onClick={() => endSession(activeSession.id)} style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444' }}>End Session</button>
                                    </div>
                                ) : <div style={{ padding: '1.5rem', background: '#222', borderRadius: '12px', textAlign: 'center', opacity: 0.5 }}>No active session</div>}
                            </div>
                        </div>

                        <div style={{ marginTop: '3rem' }}>
                            <h3>Session History</h3>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                <thead style={{ color: '#666' }}>
                                    <tr>
                                        <th style={{ padding: '0.5rem' }}>Name</th>
                                        <th style={{ padding: '0.5rem' }}>Mode</th>
                                        <th style={{ padding: '0.5rem' }}>Started</th>
                                        <th style={{ padding: '0.5rem' }}>Status</th>
                                        <th style={{ padding: '0.5rem' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessionHistory.map(hist => (
                                        <tr key={hist.id} style={{ borderBottom: '1px solid #333' }}>
                                            <td style={{ padding: '1rem 0.5rem', fontWeight: 500 }}>{hist.name}</td>
                                            <td style={{ padding: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>{hist.type}</td>
                                            <td style={{ padding: '0.5rem', opacity: 0.7 }}>{new Date(hist.start_time).toLocaleString()}</td>
                                            <td style={{ padding: '0.5rem' }}>
                                                {hist.is_active ? <span style={{ color: '#4ade80' }}>Active</span> : <span style={{ opacity: 0.3 }}>Ended</span>}
                                            </td>
                                            <td style={{ padding: '0.5rem' }}>
                                                <button onClick={() => deleteSession(hist.id)} style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}>Trash</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Admin;
