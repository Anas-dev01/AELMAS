import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard'; 
import HODDashboard from './HODDashboard'; 
import RegistrarDashboard from './RegistrarDashboard';

function App() {
  // Check localStorage on startup so refresh doesn't kill the session [cite: 409]
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('aelmas_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Persist user data to browser storage upon successful login [cite: 410, 411]
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('aelmas_user', JSON.stringify(userData)); 
  };

  // Clear session data from storage upon logout [cite: 409]
  const handleLogout = () => { 
    setUser(null); 
    localStorage.removeItem('aelmas_user');
  };

  return (
    <Router>
      <Routes>
        {/* Redirect home to Staff Login by default [cite: 410] */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* STAFF ROUTES [cite: 410] */}
        <Route path="/login" element={<Login role="Staff" onLoginSuccess={handleLogin} />} />
        <Route path="/register" element={<Register role="Staff" />} />

        {/* HOD ROUTES [cite: 410, 411] */}
        <Route path="/hod/login" element={<Login role="HOD" onLoginSuccess={handleLogin} />} />
        <Route path="/hod/register" element={<Register role="HOD" />} />

        {/* REGISTRAR ROUTES [cite: 410] */}
        <Route path="/registrar/login" element={<Login role="Registrar" onLoginSuccess={handleLogin} />} />
        <Route path="/registrar/register" element={<Register role="Registrar" />} />

        {/* PROTECTED DASHBOARDS - Role-Based Access Control (RBAC) [cite: 411, 414] */}
        <Route path="/dashboard" element={
          user?.role === 'Staff' ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="/hod/dashboard" element={
          user?.role === 'HOD' ? <HODDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/hod/login" />
        } />
        <Route path="/registrar/dashboard" element={
          user?.role === 'Registrar' ? <RegistrarDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/registrar/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;