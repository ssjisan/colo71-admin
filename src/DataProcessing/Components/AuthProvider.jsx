import { useEffect, useState } from "react";
import API from "../../api/axios";

const EMPTY_AUTH = {
  user: null,
  permissions: [],
};

export default function AuthProvider() {
  const [auth, setAuth] = useState(EMPTY_AUTH);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Axios automatically attempts refresh on an eligible 401.
        const response = await API.get("/me");

        if (!mounted) return;

        if (response.data?.success && response.data?.user) {
          setAuth({
            user: response.data.user,
            permissions: response.data.permissions || [],
          });
        } else {
          setAuth(EMPTY_AUTH);
        }
      } catch (error) {
        if (!mounted) return;

        // If /me and the refresh attempt both fail,
        // treat the user as unauthenticated.
        setAuth(EMPTY_AUTH);
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
