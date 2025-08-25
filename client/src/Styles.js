// Shared style constants to reduce redundancy

export const cardStyle = {
  background: 'rgba(30, 41, 59, 0.6)',
  backdropFilter: 'blur(10px)',
  borderRadius: '1rem',
  border: '1px solid rgba(148, 163, 184, 0.1)',
  padding: '1rem',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
};

export const buttonPrimary = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontSize: '0.875rem',
  fontWeight: '500',
  background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
  color: 'white'
};

export const buttonGhost = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontSize: '0.875rem',
  fontWeight: '500',
  background: 'transparent',
  color: '#94a3b8',
  border: '1px solid rgba(148, 163, 184, 0.2)'
};

export const buttonIcon = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem',
  borderRadius: '0.5rem',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontSize: '0.875rem',
  fontWeight: '500',
  background: 'rgba(139, 92, 246, 0.1)',
  color: '#a78bfa'
};

export const inputStyle = {
  padding: '0.75rem 1rem',
  background: 'rgba(30, 41, 59, 0.8)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: '0.5rem',
  color: '#f8fafc',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'all 0.2s'
};

export const tableHeaderStyle = {
  padding: '1.5rem',
  background: 'rgba(139, 92, 246, 0.1)',
  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
};

export const tableCellStyle = {
  padding: '0.75rem',
  borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
  borderRight: '1px solid rgba(148, 163, 184, 0.05)',
  color: '#e2e8f0',
  verticalAlign: 'top',
  height: '80px',
  position: 'relative'
};