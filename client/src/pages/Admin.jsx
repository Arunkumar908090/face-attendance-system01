import React, { useEffect, useState } from 'react';

function Admin() {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('logs'); // 'users' or 'logs'

    useEffect(() => {
        fetchUsers();
        fetchLogs();
    }, []);

    const fetchUsers = async () => {
        const res = await fetch('/api/users');
        const data = await res.json();
        setUsers(data);
    };

    const fetchLogs = async () => {
        const res = await fetch('/api/attendance');
        const data = await res.json();
        setLogs(data);
    };

    return (
        <div className="page-container" style={{ alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Admin Dashboard</h2>
                <div>
                    <button
                        className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('logs')}
                        style={{ marginRight: '1rem' }}
                    >
                        Attendance Logs
                    </button>
                    <button
                        className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Registered Users
                    </button>
                </div>
            </div>

            <div className="card" style={{ maxWidth: '100%', marginTop: '1rem' }}>
                {activeTab === 'logs' ? (
                    <>
                        <h3>Attendance Logs</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td>{log.id}</td>
                                        <td>{log.name}</td>
                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No records found</td></tr>}
                            </tbody>
                        </table>
                    </>
                ) : (
                    <>
                        <h3>Registered Users</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Registered At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.name}</td>
                                        <td>{new Date(user.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {users.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No users found</td></tr>}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div>
    );
}

export default Admin;
