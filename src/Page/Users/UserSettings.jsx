import { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Stack,
  FormControlLabel,
  Switch,
} from "@mui/material";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";

export default function UserSettings() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    role: "",
    isActive: true,
  });

  // ---------------------------
  // Load Roles
  // ---------------------------
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get("/roles");

        setRoles(res.data?.roles || res.data || []);
      } catch (err) {
        console.error("Load roles error:", err);

        toast.error(err?.response?.data?.message || "Failed to load roles");
      }
    };

    fetchRoles();
  }, []);

  // ---------------------------
  // Load User if editing
  // ---------------------------
  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${id}`);

        const user = res.data?.user || res.data;

        setForm({
          id: user._id,
          name: user.name || "",
          email: user.email || "",
          role: user.role?._id || user.role || "",
          isActive: user.isActive ?? true,
        });
      } catch (err) {
        console.error("Load user error:", err);

        toast.error(err?.response?.data?.message || "Failed to load user");
      }
    };

    fetchUser();
  }, [id]);

  // ---------------------------
  // Handle input change
  // ---------------------------
  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  // ---------------------------
  // Handle Active toggle
  // ---------------------------
  const handleActiveChange = (e) => {
    setForm((prev) => ({
      ...prev,
      isActive: e.target.checked,
    }));
  };

  // ---------------------------
  // Submit
  // ---------------------------
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.role) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);

      // ---------------------------
      // CREATE
      // ---------------------------
      if (!form.id) {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
        };

        const res = await api.post("/create-user", payload);

        toast.success(res.data?.message || "User created successfully");
      }

      // ---------------------------
      // UPDATE
      // ---------------------------
      else {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          isActive: form.isActive,
        };

        const res = await api.put(`/users/${form.id}`, payload);

        toast.success(res.data?.message || "User updated successfully");
      }

      navigate("/users");
    } catch (err) {
      console.error("User submit error:", err);

      toast.error(err?.response?.data?.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Stack
        spacing={2}
        sx={{
          width: "100%",
          maxWidth: "720px",
          mx: "auto",
          border: "1px solid #eee",
          borderRadius: "12px",
          background: "#fff",
          p: 3,
        }}
      >
        <Typography variant="h6" mb={2}>
          {form.id ? "Update User" : "Create User"}
        </Typography>

        <TextField
          label="Name"
          value={form.name}
          onChange={handleChange("name")}
          fullWidth
          required
        />

        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          fullWidth
          required
        />

        <TextField
          select
          label="Role"
          value={form.role}
          onChange={handleChange("role")}
          fullWidth
          required
        >
          <MenuItem value="">Select Role</MenuItem>

          {roles.map((role) => (
            <MenuItem key={role._id} value={role._id}>
              {role.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Active / Inactive */}
        {form.id && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid #eee",
              borderRadius: "8px",
              px: 2,
              py: 1,
            }}
          >
            <Box>
              <Typography variant="body1" fontWeight={500}>
                Account Status
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {form.isActive
                  ? "User can log in and access the system"
                  : "User cannot log in or access the system"}
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Switch checked={form.isActive} onChange={handleActiveChange} />
              }
              label={form.isActive ? "Active" : "Inactive"}
              labelPlacement="start"
            />
          </Box>
        )}

        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading
            ? form.id
              ? "Updating..."
              : "Creating..."
            : form.id
              ? "Update User"
              : "Create User"}
        </Button>
      </Stack>
    </Box>
  );
}
