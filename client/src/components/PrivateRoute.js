import { useAuth } from "../contexts/AuthContext"; 
import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
// Only allows logged in users to access certain routes
export default PrivateRoute;