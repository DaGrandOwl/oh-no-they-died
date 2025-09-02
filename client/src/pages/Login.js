import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PrefContext';

const styles = {
  container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #0f172a, #1e293b)', fontFamily: "'Inter', sans-serif", color: '#fff' },
  card: { background: 'rgba(255, 255, 255, 0.05)', padding: '2.5rem', borderRadius: '1rem', boxShadow: '0 4px 30px rgba(0,0,0,0.2)', width: '100%', maxWidth: '400px', textAlign: 'center', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' },
  title: { fontSize: '1.8rem', marginBottom: '1.5rem', fontWeight: '600' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  label: { textAlign: 'left', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' },
  input: { padding: '0.8rem', borderRadius: '0.5rem', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem', transition: 'all 0.2s ease' },
  button: { padding: '0.8rem', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: '0.5rem', color: '#fff', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'transform 0.2s ease' },
  error: { color: '#f87171', fontSize: '0.85rem', marginTop: '-0.5rem' },
  registerText: { marginTop: '1rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' },
  link: { color: '#38bdf8', textDecoration: 'none' }
};

function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { login } = useAuth();
  const { updatePrefs } = usePreferences();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Store token
      localStorage.setItem('token', data.token);

      // Update Auth Context
      login({ id: data.user.id, email: data.user.email }, data.token);

      // Merge preferences: prefer DB if newer
      const localRaw = localStorage.getItem('preferences');
      const localPrefs = localRaw ? JSON.parse(localRaw) : {};
      const dbPrefs = data.preferences || {};

      const localUpdated = localPrefs.lastUpdated ? new Date(localPrefs.lastUpdated) : null;
      const dbUpdated = dbPrefs.lastUpdated ? new Date(dbPrefs.lastUpdated) : null;

      const mergedPrefs =
        dbUpdated && (!localUpdated || dbUpdated > localUpdated)
          ? dbPrefs
          : { ...localPrefs, ...dbPrefs, lastUpdated: new Date().toISOString() };

      // Set in context and localStorage
      updatePrefs(mergedPrefs);
      localStorage.setItem('preferences', JSON.stringify(mergedPrefs));

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('An error occurred');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email or Username</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            style={styles.input}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button}>Login</button>
        </form>
        <p style={styles.registerText}>
          Don’t have an account? <a href="/register" style={styles.link}>Register</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
