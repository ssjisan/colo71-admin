
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  ArrowBack,
  CalendarToday,
} from "@mui/icons-material";
import ContentRenderer from "../../lib/html2text";


const SERVER_URL = (import.meta.env.VITE_SERVER_API || "").replace(/\/$/, "");

export default function BlogPreview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchBlog = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${SERVER_URL}/blogs/${id}`);

        if (active) {
          setBlog(response.data?.data || response.data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load this blog. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (id) fetchBlog();

    return () => {
      active = false;
    };
  }, [id]);

  const getImageUrl = (url) => {
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    return `${SERVER_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !blog) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Blog not found."}
        </Alert>

        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Breadcrumbs>
            <Typography
              color="text.secondary"
              sx={{ cursor: "pointer" }}
              onClick={() => navigate("/blogs")}
            >
              Blogs
            </Typography>

            <Typography color="text.primary">
              Preview
            </Typography>
          </Breadcrumbs>

          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </Stack>

        {/* Blog */}
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            maxWidth: 900,
            mx: "auto",
            overflow: "hidden",
            borderRadius: 3,
          }}
        >
          {/* Cover */}
          {blog.coverPhoto && (
            <Box
              component="img"
              src={getImageUrl(blog.coverPhoto)}
              alt={blog.title}
              sx={{
                display: "block",
                width: "100%",
                maxHeight: 460,
                objectFit: "cover",
              }}
            />
          )}

          <Box sx={{ p: { xs: 2.5, md: 5 } }}>
            {/* Status */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {blog.published ? (
                <Alert severity="success" icon={false} sx={{ py: 0 }}>
                  Published
                </Alert>
              ) : (
                <Alert severity="warning" icon={false} sx={{ py: 0 }}>
                  Draft
                </Alert>
              )}

              {blog.featured && (
                <Alert severity="info" icon={false} sx={{ py: 0 }}>
                  Featured
                </Alert>
              )}
            </Stack>

            {/* Title */}
            <Typography
              variant="h3"
              component="h1"
              fontWeight={700}
              sx={{
                mb: 2,
                lineHeight: 1.25,
                fontSize: {
                  xs: "1.8rem",
                  md: "2.5rem",
                },
              }}
            >
              {blog.title}
            </Typography>

            {/* Excerpt */}
            {blog.excerpt && (
              <Typography
                variant="h6"
                color="text.secondary"
                fontWeight={400}
                sx={{
                  mb: 3,
                  lineHeight: 1.7,
                }}
              >
                {blog.excerpt}
              </Typography>
            )}

            {/* Meta */}
            <Stack
              direction="row"
              flexWrap="wrap"
              gap={2}
              alignItems="center"
              sx={{ mb: 4 }}
            >
             
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarToday fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {blog.publishedAt
                    ? new Date(blog.publishedAt).toLocaleDateString()
                    : new Date(blog.createdAt).toLocaleDateString()}
                </Typography>
              </Stack>
            </Stack>

            <Divider sx={{ mb: 4 }} />

            {/* Blog Content */}
            <Box
              sx={{
                "& p": {
                  fontSize: "1rem",
                  lineHeight: 1.9,
                },
                "& img": {
                  maxWidth: "100%",
                },
              }}
            >
              <ContentRenderer html={blog.contentHTML} />
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
