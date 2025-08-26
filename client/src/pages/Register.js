import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PrefContext';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { login } = useAuth();
  const { updatePrefs } = usePreferences();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { username, email, password } = form;
    if (!username || !email || !password) {
      setError('All fields are required.');
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Auto-login: store token
      localStorage.setItem('token', data.token);

      // Initialize empty preferences with timestamp
      const initialPrefs = { lastUpdated: new Date().toISOString() };
      updatePrefs(initialPrefs);
      localStorage.setItem('preferences', JSON.stringify(initialPrefs));

      // Update Auth Context
      login({ id: data.user.id, email: data.user.email }, data.token);

      navigate('/onboarding');
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again later.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Username</label>
          <input
            name="username"
            placeholder="Enter username"
            value={form.username}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <label style={styles.label}>Email</label>
          <input
            name="email"
            placeholder="Enter email"
            value={form.email}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
            style={styles.input}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button}>Register</button>
        </form>
        <p style={styles.loginText}>
          Already have an account? <a href="/login" style={styles.link}>Login</a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
    fontFamily: "'Inter', sans-serif",
    color: '#fff'
  },
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '2.5rem',
    borderRadius: '1rem',
    boxShadow: '0 4px 30px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  title: {
    fontSize: '1.8rem',
    marginBottom: '1.5rem',
    fontWeight: '600'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  label: {
    textAlign: 'left',
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.8)'
  },
  input: {
    padding: '0.8rem',
    borderRadius: '0.5rem',
    border: 'none',
    outline: 'none',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: '1rem',
    transition: 'all 0.2s ease'
  },
  button: {
    padding: '0.8rem',
    background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
    border: 'none',
    borderRadius: '0.5rem',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  error: {
    color: '#f87171',
    fontSize: '0.85rem',
    marginTop: '-0.5rem'
  },
  loginText: {
    marginTop: '1rem',
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.7)'
  },
  link: {
    color: '#38bdf8',
    textDecoration: 'none'
  }
};
