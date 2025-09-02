import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function UnauthenticatedRoute({ children, redirectTo = "/dashboard" }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  // If user is logged in, redirect to dashboard; otherwise show the public page.
  return isAuthenticated ? <Navigate to={redirectTo} replace /> : children;
}
