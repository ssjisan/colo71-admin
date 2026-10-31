import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { useNavigate, useParams } from "react-router-dom";
import BlogInfo from "./components/BlogInfo";
import BlogEditor from "./components/BlogEditor";
import axios from "../../../api/axios";
import toast from "react-hot-toast";

const MAX_COVER_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const EMPTY_CONTENT = [
  {
    type: "paragraph",
    children: [{ text: "" }],
  },
];

const SERVER_URL = (import.meta.env.VITE_SERVER_API || "").replace(/\/+$/, "");

const getImageUrl = (src) => {
  if (!src) return "";

  if (/^https?:\/\//i.test(src)) {
    return src;
  }

  return `${SERVER_URL}/${src.replace(/^\/+/, "")}`;
};

const parseContentJSON = (content) => {
  if (!content) return EMPTY_CONTENT;

  try {
    const parsed = typeof content === "string" ? JSON.parse(content) : content;

    return Array.isArray(parsed) && parsed.length ? parsed : EMPTY_CONTENT;
  } catch (error) {
    console.error("Could not parse blog content:", error);
    return EMPTY_CONTENT;
  }
};

export default function BlogEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Blog information
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [editorValue, setEditorValue] = useState(EMPTY_CONTENT);

  // Cover image
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [originalCover, setOriginalCover] = useState("");

  // Publication settings
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);

  // Loading states
  const [pageLoading, setPageLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Upload session
  const [sessionId, setSessionId] = useState("");

  // Fetch existing blog and initialize upload session
  useEffect(() => {
    let active = true;

    const initializePage = async () => {
      setPageLoading(true);
      setSessionLoading(true);

      try {
        const [blogResponse, sessionResponse] = await Promise.all([
          axios.get(`/blogs/${id}`),
          axios.post("/blogs/upload-session"),
        ]);

        if (!active) return;

        // Adapt to common API response wrappers
        const responseData = blogResponse.data?.data;
        const blog = responseData?.blog || responseData;

        if (!blog || !blog._id) {
          throw new Error("Blog data was not found.");
        }

        // Populate form
        setTitle(blog.title || "");
        setExcerpt(blog.excerpt || "");

        setEditorValue(parseContentJSON(blog.contentJSON));

        setFeatured(Boolean(blog.featured));
        setPublished(Boolean(blog.published ?? blog.status === "published"));

        // Existing cover image
        const existingCover =
          blog.coverPhoto?.url ||
          blog.coverPhoto ||
          blog.coverImage?.url ||
          blog.coverImage ||
          "";

        const coverUrl = getImageUrl(existingCover);

        setOriginalCover(coverUrl);
        setCoverPreview(coverUrl);

        // New upload session for newly added editor images
        const newSessionId = sessionResponse.data?.data?.sessionId || "";

        if (!newSessionId) {
          throw new Error("Could not initialize the image upload session.");
        }

        setSessionId(newSessionId);
      } catch (error) {
        console.error("Blog edit initialization error:", error);

        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Could not load blog.",
        );
      } finally {
        if (active) {
          setPageLoading(false);
          setSessionLoading(false);
        }
      }
    };

    if (id) {
      initializePage();
    }

    return () => {
      active = false;
    };
  }, [id]);

  // Revoke temporary cover preview URL
  useEffect(() => {
    return () => {
      if (coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  // Handle new cover image
  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Choose a JPG, PNG, WEBP, GIF, or AVIF image.");
      return;
    }

    if (file.size < 1 || file.size > MAX_COVER_SIZE) {
      toast.error("Cover image must be 5 MB or smaller.");
      return;
    }

    const preview = URL.createObjectURL(file);

    setCoverFile(file);
    setCoverPreview(preview);
  };

  // Cancel cover replacement and restore existing cover
  const handleRestoreCover = () => {
    setCoverFile(null);
    setCoverPreview(originalCover);
  };

  // Update blog
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      return toast.error("Blog title is required.");
    }

    if (!Array.isArray(editorValue) || !editorValue.length) {
      return toast.error("Please add blog content.");
    }

    if (!sessionId) {
      return toast.error("Upload session is not ready. Please try again.");
    }

    const formData = new FormData();

    formData.append("title", title.trim());
    formData.append("excerpt", excerpt.trim());
    formData.append("contentJSON", JSON.stringify(editorValue));
    formData.append("featured", String(featured));
    formData.append("published", String(published));

    // Only send a new cover if the user selected one.
    // Otherwise the existing cover remains unchanged.
    if (coverFile) {
      formData.append("coverPhoto", coverFile);
    }

    setLoading(true);

    try {
      const { data } = await axios.put(`/blogs/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-upload-session-id": sessionId,
        },
      });

      toast.success(data?.message || "Blog updated successfully.");

      setSessionId("");

      navigate("/blogs");
    } catch (error) {
      console.error("Blog update error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to update the blog. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Stack alignItems="center" justifyContent="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">
            Loading blog information...
          </Typography>
        </Stack>
      </Container>
    );
  }

  if (!title && !sessionId) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Alert severity="error">
          Could not load this blog. Please check the blog ID and try again.
        </Alert>

        <Button onClick={() => navigate("/blogs")} sx={{ mt: 2 }}>
          Back to blogs
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ pb: "100px" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
      <Stack spacing={3}>
        {/* Page header */}
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Edit Blog
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Update your blog content, images, and publication settings.
          </Typography>
        </Box>

        {sessionLoading && (
          <Alert severity="info">
            Preparing editor image upload session...
          </Alert>
        )}

        {!sessionLoading && !sessionId && (
          <Alert severity="error">
            Could not initialize image uploads. Please refresh this page.
          </Alert>
        )}

        <Box component="form" id="blog-edit-form" onSubmit={handleSubmit}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                lg: "minmax(0, 0.85fr) minmax(0, 1.65fr)",
              },
              gap: 3,
              alignItems: "start",
            }}
          >
            <BlogInfo
              title={title}
              setTitle={setTitle}
              excerpt={excerpt}
              setExcerpt={setExcerpt}
              coverFile={coverFile}
              coverPreview={coverPreview}
              originalCover={originalCover}
              onCoverChange={handleCoverChange}
              onRemoveCover={handleRestoreCover}
              onRestoreCover={handleRestoreCover}
              disabled={loading}
            />

            <BlogEditor
              editorValue={editorValue}
              onEditorChange={(json) => setEditorValue(json)}
              featured={featured}
              setFeatured={setFeatured}
              published={published}
              setPublished={setPublished}
              sessionId={sessionId}
              disabled={loading}
            />
          </Box>
        </Box>
        <Paper
          elevation={8}
          square
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: (theme) => theme.zIndex.appBar,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Container maxWidth="lg">
            <Stack
              direction={{ xs: "column-reverse", sm: "row" }}
              justifyContent="flex-end"
              spacing={1.5}
              sx={{ py: 2 }}
            >
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate("/blogs")}
                disabled={loading}
                fullWidth
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="blog-edit-form"
                variant="contained"
                disabled={loading || sessionLoading || !sessionId}
                fullWidth
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                {loading
                  ? "Updating blog..."
                  : published
                    ? "Update and publish"
                    : "Update blog"}
              </Button>
            </Stack>
          </Container>
        </Paper>
      </Stack>
      </Container>
    </Box>
  );
}
