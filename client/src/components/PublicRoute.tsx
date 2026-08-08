import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps public pages (landing / login). If the user is already logged in
// (token remembered in localStorage), send them straight to their dashboard
// instead of showing the login screen again.
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user, isLoading } = useAuth();
  if (isLoading) return null;
  if (token && user) {
    return (
      <Navigate
        to={user.role === "manager" ? "/manager/dashboard" : "/worker/home"}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default PublicRoute;
