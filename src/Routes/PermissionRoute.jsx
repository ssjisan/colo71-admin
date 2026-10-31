import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { DataContext } from "../DataProcessing/DataProcessing";
import { hasPermission } from "../lib/hasPermission";
import Loading from "./Loading";

export default function PermissionRoute() {
  const { auth, loading } = useContext(DataContext);
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  if (!auth?.user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const pathname = location.pathname.replace(/\/+$/, "") || "/";

  const permission = (auth.permissions || []).find((item) => {
    const pagePath = item.page?.path;

    if (!pagePath) return false;

    const normalizedPagePath = pagePath.replace(/\/+$/, "") || "/";

    return (
      pathname === normalizedPagePath ||
      (normalizedPagePath !== "/" &&
        pathname.startsWith(`${normalizedPagePath}/`))
    );
  });

  const slug = pathname === "/" ? "dashboard" : permission?.page?.slug;

  if (!slug) {
    return <Navigate to="/unauthorized" replace />;
  }

  const allowed = hasPermission(auth.permissions || [], slug, "canView");

  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
