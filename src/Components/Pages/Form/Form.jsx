import {
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

const initialForm = {
  id: "",
  name: "",
  path: "",
  icon: "",
  order: 0,
  parent: "",
  isMenu: true,
  isActive: true,
  description: "",
};

export default function Form({ id }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);

  // -----------------------------------------
  // Load pages for Parent dropdown
  // -----------------------------------------
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await api.get("/pages");

        // Flatten tree for dropdown
        const flatten = (data) => {
          let result = [];

          data.forEach((item) => {
            result.push(item);

            if (item.children?.length) {
              result = result.concat(flatten(item.children));
            }
          });

          return result;
        };

        const pageList = Array.isArray(res.data) ? flatten(res.data) : [];

        setPages(pageList);
      } catch (err) {
        console.error("Load pages error:", err);

        toast.error(err?.response?.data?.message || "Failed to load pages");
      }
    };

    fetchPages();
  }, []);

  // -----------------------------------------
  // Load selected page when editing
  // -----------------------------------------
  useEffect(() => {
    if (!id) {
      setForm(initialForm);
      return;
    }

    const fetchPage = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/pages/${id}`);

        const page = res.data?.data || res.data;

        setForm({
          id: page._id,
          name: page.name || "",
          path: page.path || "",
          icon: page.icon || "",
          order: page.order ?? 0,
          parent: page.parent?._id || page.parent || "",
          isMenu: page.isMenu ?? true,
          isActive: page.isActive ?? true,
          description: page.description || "",
        });
      } catch (err) {
        console.error("Load page error:", err);

        toast.error(err?.response?.data?.message || "Failed to load page");
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [id]);

  // -----------------------------------------
  // Handle field changes
  // -----------------------------------------
  const handleChange = (field) => (e) => {
    const value =
      field === "isMenu" || field === "isActive"
        ? e.target.checked
        : e.target.value;

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // -----------------------------------------
  // Submit
  // -----------------------------------------
  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Page name is required");
      return;
    }

    if (!form.path.trim()) {
      toast.error("Page path is required");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        path: form.path.trim(),
        icon: form.icon.trim(),
        order: Number(form.order) || 0,
        parent: form.parent || null,
        isMenu: form.isMenu,
        isActive: form.isActive,
        description: form.description.trim(),
      };

      // -----------------------------------------
      // CREATE
      // -----------------------------------------
      if (!form.id) {
        const res = await api.post("/pages", payload);

        toast.success(res.data?.message || "Page created successfully");
      }

      // -----------------------------------------
      // UPDATE
      // -----------------------------------------
      else {
        const res = await api.put(`/pages/${form.id}`, payload);

        toast.success(res.data?.message || "Page updated successfully");
      }

      navigate("/pages");
    } catch (err) {
      console.error("Page submit error:", err);

      toast.error(err?.response?.data?.message || "Failed to save page");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        mt: 3,
        p: 3,
        border: "1px solid #eee",
        borderRadius: "12px",
        background: "#fff",
        width: "100%",
        maxWidth: "720px",
        mx: "auto",
      }}
    >
      <Stack spacing={2}>
        {/* Page Name */}
        <TextField
          label="Page Name"
          value={form.name}
          onChange={handleChange("name")}
          fullWidth
          required
        />

        {/* Path */}
        <TextField
          label="Path (route)"
          placeholder="/settings"
          value={form.path}
          onChange={handleChange("path")}
          fullWidth
          required
        />

        {/* Icon */}
        <TextField
          label="Icon Name"
          placeholder="dashboard"
          value={form.icon}
          onChange={handleChange("icon")}
          fullWidth
        />

        {/* Order */}
        <TextField
          label="Order"
          type="number"
          value={form.order}
          onChange={handleChange("order")}
          fullWidth
        />

        {/* Parent */}
        <TextField
          select
          label="Parent Page"
          value={form.parent}
          onChange={handleChange("parent")}
          fullWidth
        >
          <MenuItem value="">None</MenuItem>

          {pages
            .filter((page) => page._id !== form.id)
            .map((page) => (
              <MenuItem key={page._id} value={page._id}>
                {page.name}
              </MenuItem>
            ))}
        </TextField>

        {/* Sidebar */}
        <FormControlLabel
          control={
            <Switch checked={form.isMenu} onChange={handleChange("isMenu")} />
          }
          label="Show in Sidebar (isMenu)"
        />

        {/* Active */}
        <FormControlLabel
          control={
            <Switch
              checked={form.isActive}
              onChange={handleChange("isActive")}
            />
          }
          label="Active Page"
        />

        {/* Description */}
        <TextField
          label="Description"
          multiline
          rows={3}
          value={form.description}
          onChange={handleChange("description")}
          fullWidth
        />

        {/* Submit */}
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading
            ? form.id
              ? "Updating..."
              : "Creating..."
            : form.id
              ? "Update Page"
              : "Create Page"}
        </Button>
      </Stack>
    </Box>
  );
}

Form.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
