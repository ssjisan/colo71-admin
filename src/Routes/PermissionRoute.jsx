import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { DataContext } from "../DataProcessing/DataProcessing";
import { hasPermission } from "../lib/hasPermission";

export default function PermissionRoute() {
  const { auth } = useContext(DataContext);
  const location = useLocation();

  if (!auth?.user) {
    return <Navigate to="/login" replace />;
  }

  const slug =
    location.pathname === "/" ? "dashboard" : location.pathname.split("/")[1];

  const allowed = hasPermission(auth.permissions || [], slug, "canView");

  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
