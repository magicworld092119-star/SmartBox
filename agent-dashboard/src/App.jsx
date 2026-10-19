import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrderDetails from './pages/OrderDetails';
import Profile from './pages/Profile';
import AgentShell from './components/AgentShell';

function App() {
  const [token, setToken] = useState(sessionStorage.getItem('agent_token'));

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('agent_token', token);
    } else {
      sessionStorage.removeItem('agent_token');
    }
  }, [token]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!token ? <Login setToken={setToken} /> : <Navigate to="/" />} />
        <Route
          element={token ? <AgentShell token={token} setToken={setToken} /> : <Navigate to="/login" />}
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders/:orderId" element={<OrderDetails />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to={token ? '/' : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
