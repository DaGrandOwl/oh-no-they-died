import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

//Only allows unauthenticated users to access certain routes
export default function UnauthenticatedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  //Allow new users to go to onboarding page
  if (isAuthenticated) {
    if (user && !user.hasOnboarded) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}