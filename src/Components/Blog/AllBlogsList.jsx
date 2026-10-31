
import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  Add,
  DeleteOutline,
  EditOutlined,
  Refresh,
  VisibilityOutlined,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import toast from "react-hot-toast";

export default function AllBlogsList() {
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch blogs
  const loadBlogs = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await axios.get("/blogs/admin", {
        params: { page: 1, limit: 100 },
      });

      setBlogs(data?.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not load blogs."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  // Delete blog
  const handleDelete = async (blog) => {
    const confirmed = window.confirm(
      `Delete "${blog.title}"? This also deletes its stored images.`
    );

    if (!confirmed) return;

    try {
      await axios.delete(`/blogs/${blog._id}`);

      setBlogs((items) =>
        items.filter((item) => item._id !== blog._id)
      );

      toast.success("Blog deleted.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not delete blog."
      );
    }
  };

  // Open preview
  const handlePreview = (blog) => {
    navigate(`/blog-preview/${blog._id}`);
  };

  // Open edit page
  const handleEdit = (blog) => {
    navigate(`/edit-blog/${blog._id}`);
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
      }}
    >
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            All Blogs
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Manage, edit, preview and delete your blog posts.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadBlogs}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate("/blogs/create")}
          >
            Add Blog
          </Button>
        </Stack>
      </Stack>

      {/* Table */}
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          py={6}
        >
          <CircularProgress />
        </Box>
      ) : blogs.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">
            No blogs found.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Blog</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {blogs.map((blog) => (
                <TableRow
                  key={blog._id}
                  hover
                >
                  {/* Blog title */}
                  <TableCell sx={{ minWidth: 220 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                    >
                      {blog.title}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {blog.slug}
                    </Typography>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    {blog.category || "—"}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Chip
                      size="small"
                      label={blog.status || "Draft"}
                      color={
                        blog.status === "published"
                          ? "success"
                          : "default"
                      }
                      variant="outlined"
                    />
                  </TableCell>

                  {/* Created date */}
                  <TableCell>
                    {blog.createdAt
                      ? new Date(blog.createdAt).toLocaleDateString()
                      : "—"}
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="flex-end"
                    >
                      <Tooltip title="Preview blog">
                        <IconButton
                          aria-label="Preview blog"
                          color="info"
                          onClick={() => handlePreview(blog)}
                        >
                          <VisibilityOutlined />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Edit blog">
                        <IconButton
                          aria-label="Edit blog"
                          color="primary"
                          onClick={() => handleEdit(blog)}
                        >
                          <EditOutlined />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete blog">
                        <IconButton
                          aria-label="Delete blog"
                          color="error"
                          onClick={() => handleDelete(blog)}
                        >
                          <DeleteOutline />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Paper>
  );
}
