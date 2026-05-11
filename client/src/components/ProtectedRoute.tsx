import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "worker" | "manager";
}) => {
  const { token, user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!token) {
    return <Navigate to="/" />;
  }
  if (user?.role !== role) return <Navigate to="/" />;

  return <>{children}</>;
};

export default ProtectedRoute;
