import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}
// PrivateRoute component checks if a token exists in localStorage
// If it does, it renders the children components; otherwise, it redirects to the login page.
export default PrivateRoute;

