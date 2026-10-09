import { useEffect, useState } from "react";
import API from "../../api/axios";

export default function AuthProvider() {
  const [auth, setAuth] = useState({
    user: null,
    permissions: [],
  });

  const [loading, setLoading] = useState(true);

  // ==================================================
  // Check existing login session
  // ==================================================

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const response = await API.get("/me");

        if (!mounted) return;

        if (response.data?.success) {
          setAuth({
            user: response.data.user || null,
            permissions: response.data.permissions || [],
          });
        } else {
          setAuth({
            user: null,
            permissions: [],
          });
        }
      } catch (error) {
        if (!mounted) return;

        setAuth({
          user: null,
          permissions: [],
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    auth,
    setAuth,
    loading,
  };
}
