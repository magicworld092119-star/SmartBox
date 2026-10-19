import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Orders from './pages/Orders';
import Merchants from './pages/Merchants';
import Login from './pages/Login';

function Sidebar({ setToken }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
        <h2 style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 800 }}>SmartBox Admin</h2>
      </div>
      <nav style={{ padding: '16px 0', display: 'flex', flexDirection: 'column' }}>
        <Link to="/" style={navStyle(isActive('/'))}>
          Dashboard Overview
        </Link>
        <Link to="/orders" style={navStyle(isActive('/orders'))}>
          Manage Orders
        </Link>
        <Link to="/agents" style={navStyle(isActive('/agents'))}>
          Agents & Zones
        </Link>
        <Link to="/merchants" style={navStyle(isActive('/merchants'))}>
          Merchants
        </Link>
      </nav>
      <div style={{ padding: '16px 24px', marginTop: 'auto' }}>
        <button
          onClick={() => {
            sessionStorage.removeItem('admin_token');
            setToken(null);
          }}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'white', cursor: 'pointer', fontWeight: 500 }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}

const navStyle = (active) => ({
  padding: '12px 24px',
  background: active ? 'var(--bg-base)' : 'transparent',
  borderRight: active ? '3px solid var(--primary)' : '3px solid transparent',
  fontWeight: active ? 600 : 400,
  color: active ? 'var(--primary)' : 'var(--text-muted)',
  cursor: 'pointer',
  textDecoration: 'none'
});

function App() {
  const [token, setTokenState] = useState(() => sessionStorage.getItem('admin_token') || 'admin_bypass_token');

  const setToken = (tok) => {
    if (tok) {
      sessionStorage.setItem('admin_token', tok);
    } else {
      sessionStorage.removeItem('admin_token');
    }
    setTokenState(tok);
  };

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('admin_token', token);
    }
  }, [token]);

  if (!token) {
    return <Login setToken={setToken} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar setToken={setToken} />

        {/* Main */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders token={token} setToken={setToken} />} />
            <Route path="/agents" element={<Agents token={token} setToken={setToken} />} />
            <Route path="/merchants" element={<Merchants token={token} setToken={setToken} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
