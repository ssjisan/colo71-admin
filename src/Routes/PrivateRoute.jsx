import { useContext } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { DataContext } from "../DataProcessing/DataProcessing";
import Loading from "./Loading";

export default function PrivateRoute() {
  const { auth, loading } = useContext(DataContext);

  // AuthProvider is still checking the session
  if (loading) {
    return <Loading />;
  }

  // No authenticated user
  if (!auth?.user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated
  return <Outlet />;
}
