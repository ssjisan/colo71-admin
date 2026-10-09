import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";

import PropTypes from "prop-types";

const initialForm = {
  id: "",
  name: "",
  description: "",
  permissions: [],
};

export default function Form({ id }) {
  const navigate = useNavigate();

  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(initialForm);

  // =========================
  // Load pages
  // =========================
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await api.get("/pages");

        const flattenPages = (data, level = 0, parentOrder = "") => {
          let result = [];

          data.forEach((item, index) => {
            const displayOrder = parentOrder
              ? `${parentOrder}.${index + 1}`
              : `${index + 1}`;

            result.push({
              ...item,
              level,
              displayOrder,
            });

            if (item.children?.length) {
              result = result.concat(
                flattenPages(item.children, level + 1, displayOrder),
              );
            }
          });

          return result;
        };

        const flattenedPages = flattenPages(
          Array.isArray(res.data) ? res.data : [],
        );

        setPages(flattenedPages);
      } catch (err) {
        console.error("Load pages error:", err);

        toast.error(err?.response?.data?.message || "Failed to load pages");
      }
    };

    fetchPages();
  }, []);

  // =========================
  // Load role when editing
  // =========================
  useEffect(() => {
    if (!id) {
      setForm(initialForm);
      return;
    }

    const fetchRole = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/role/${id}`);

        const role = res.data?.data || res.data?.role || res.data;

        setForm({
          id: role._id,
          name: role.name || "",
          description: role.description || "",
          permissions: role.permissions || [],
        });
      } catch (err) {
        console.error("Load role error:", err);

        toast.error(err?.response?.data?.message || "Failed to load role");
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [id]);

  // =========================
  // Basic input
  // =========================
  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  // =========================
  // Get page ID safely
  // =========================
  const getPageId = (page) => {
    if (!page) return "";

    if (typeof page === "object") {
      return page._id?.toString() || "";
    }

    return page.toString();
  };

  // =========================
  // Find permission
  // =========================
  const findPermission = (pageId, permissions = form.permissions) => {
    return permissions.find(
      (permission) => getPageId(permission.page) === pageId.toString(),
    );
  };

  // =========================
  // Permission toggle
  // =========================
  const handlePermissionChange = (pageId, field) => (e) => {
    const checked = e.target.checked;

    setForm((prev) => {
      const permissions = [...prev.permissions];

      const index = permissions.findIndex(
        (permission) => getPageId(permission.page) === pageId.toString(),
      );

      if (index === -1) {
        permissions.push({
          page: pageId,
          canView: false,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          [field]: checked,
        });
      } else {
        permissions[index] = {
          ...permissions[index],
          [field]: checked,
        };
      }

      return {
        ...prev,
        permissions,
      };
    });
  };

  // =========================
  // Is permission checked
  // =========================
  const isChecked = (pageId, field) => {
    const permission = findPermission(pageId);

    return permission ? Boolean(permission[field]) : false;
  };

  // =========================
  // Select all permissions
  // =========================
  const handleSelectAllRow = (pageId) => (e) => {
    const checked = e.target.checked;

    setForm((prev) => {
      const permissions = [...prev.permissions];

      const index = permissions.findIndex(
        (permission) => getPageId(permission.page) === pageId.toString(),
      );

      if (index === -1) {
        permissions.push({
          page: pageId,
          canView: checked,
          canCreate: checked,
          canUpdate: checked,
          canDelete: checked,
        });
      } else {
        permissions[index] = {
          ...permissions[index],
          canView: checked,
          canCreate: checked,
          canUpdate: checked,
          canDelete: checked,
        };
      }

      return {
        ...prev,
        permissions,
      };
    });
  };

  // =========================
  // All checked
  // =========================
  const isAllChecked = (pageId) => {
    const permission = findPermission(pageId);

    if (!permission) return false;

    return (
      Boolean(permission.canView) &&
      Boolean(permission.canCreate) &&
      Boolean(permission.canUpdate) &&
      Boolean(permission.canDelete)
    );
  };

  // =========================
  // Indeterminate
  // =========================
  const isIndeterminate = (pageId) => {
    const permission = findPermission(pageId);

    if (!permission) return false;

    const values = [
      Boolean(permission.canView),
      Boolean(permission.canCreate),
      Boolean(permission.canUpdate),
      Boolean(permission.canDelete),
    ];

    return values.some(Boolean) && !values.every(Boolean);
  };

  // =========================
  // Submit
  // =========================
  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),

        permissions: form.permissions.map((permission) => ({
          page: getPageId(permission.page),
          canView: Boolean(permission.canView),
          canCreate: Boolean(permission.canCreate),
          canUpdate: Boolean(permission.canUpdate),
          canDelete: Boolean(permission.canDelete),
        })),
      };

      let res;

      // =========================
      // UPDATE
      // =========================
      if (form.id) {
        res = await api.put(`/roles/${form.id}`, payload);
      }

      // =========================
      // CREATE
      // =========================
      else {
        res = await api.post("/role-settings", payload);
      }

      toast.success(
        res.data?.message ||
          (form.id ? "Role updated successfully" : "Role created successfully"),
      );

      navigate("/roles");
    } catch (err) {
      console.error("Role submit error:", err);

      toast.error(
        err?.response?.data?.message ||
          (form.id ? "Failed to update role" : "Failed to create role"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        width: "100%",
        maxWidth: "900px",
        mx: "auto",
      }}
    >
      {/* =========================
          Role Information
      ========================= */}
      <Stack spacing={2} mb={3}>
        <TextField
          label="Role Name"
          value={form.name}
          onChange={handleChange("name")}
          fullWidth
          required
        />

        <TextField
          label="Description"
          value={form.description}
          onChange={handleChange("description")}
          fullWidth
          multiline
          rows={2}
        />
      </Stack>

      {/* =========================
          Permissions
      ========================= */}
      <Box
        sx={{
          boxShadow:
            "0px 0px 2px rgba(145, 158, 171, 0.2), 0px 12px 24px -4px rgba(145, 158, 171, 0.12)",
          borderRadius: "16px",
          p: 2,
          mt: 3,
          mb: 3,
          overflow: "hidden",
        }}
      >
        <TableContainer sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    width: "45%",
                  }}
                >
                  Page
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  All
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  View
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Create
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Update
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Delete
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {pages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No pages found
                  </TableCell>
                </TableRow>
              ) : (
                pages.map((page) => (
                  <TableRow key={page._id}>
                    {/* Page */}
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          pl: page.level * 3,
                        }}
                      >
                        <Box>
                          <Box
                            component="span"
                            sx={{
                              fontWeight: page.level === 0 ? 600 : 400,
                            }}
                          >
                            {page.name}
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* All */}
                    <TableCell align="center">
                      <Checkbox
                        checked={isAllChecked(page._id)}
                        indeterminate={isIndeterminate(page._id)}
                        onChange={handleSelectAllRow(page._id)}
                      />
                    </TableCell>

                    {/* View */}
                    <TableCell align="center">
                      <Checkbox
                        checked={isChecked(page._id, "canView")}
                        onChange={handlePermissionChange(page._id, "canView")}
                      />
                    </TableCell>

                    {/* Create */}
                    <TableCell align="center">
                      <Checkbox
                        checked={isChecked(page._id, "canCreate")}
                        onChange={handlePermissionChange(page._id, "canCreate")}
                      />
                    </TableCell>

                    {/* Update */}
                    <TableCell align="center">
                      <Checkbox
                        checked={isChecked(page._id, "canUpdate")}
                        onChange={handlePermissionChange(page._id, "canUpdate")}
                      />
                    </TableCell>

                    {/* Delete */}
                    <TableCell align="center">
                      <Checkbox
                        checked={isChecked(page._id, "canDelete")}
                        onChange={handlePermissionChange(page._id, "canDelete")}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* =========================
          Submit
      ========================= */}
      <Button variant="contained" onClick={handleSubmit} disabled={loading}>
        {loading ? "Saving..." : form.id ? "Update Role" : "Create Role"}
      </Button>
    </Box>
  );
}

Form.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
