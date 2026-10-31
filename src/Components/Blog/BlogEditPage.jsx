/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  ArrowBack,
  ArticleOutlined,
  CloudUploadOutlined,
} from "@mui/icons-material";

import { useNavigate, useParams } from "react-router-dom";
import Editor from "../Editor/Editor";
import axios from "../../api/axios";
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
  const [htmlOutput, setHtmlOutput] = useState("");

  // Cover image
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [originalCover, setOriginalCover] = useState("");

  // Editor images
  const [uploadedImages, setUploadedImages] = useState([]);

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

        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/blogs")}
          sx={{ mt: 2 }}
        >
          Back to blogs
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{ mb: 1 }}
            >
              Back
            </Button>

            <Typography variant="h4" fontWeight={700}>
              Edit Blog
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Update your blog content, images and publication settings.
            </Typography>
          </Box>

          <Chip
            icon={<ArticleOutlined />}
            label="Editing article"
            variant="outlined"
          />
        </Stack>

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

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Blog information */}
            <Paper
              variant="outlined"
              sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}
            >
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={600}>
                  Blog information
                </Typography>

                <TextField
                  label="Blog title"
                  placeholder="Enter a descriptive blog title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  fullWidth
                  inputProps={{ maxLength: 200 }}
                  helperText={`${title.length}/200 characters`}
                  disabled={loading}
                />

                <TextField
                  label="Short excerpt"
                  placeholder="A short introduction for the blog listing"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  multiline
                  minRows={3}
                  fullWidth
                  inputProps={{ maxLength: 500 }}
                  helperText={`${excerpt.length}/500 characters`}
                  disabled={loading}
                />
              </Stack>
            </Paper>

            {/* Cover image */}
            <Paper
              variant="outlined"
              sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Cover image
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Choose a new image to replace the existing cover. JPG, PNG,
                    WEBP, GIF, or AVIF. Maximum size: 5 MB.
                  </Typography>
                </Box>

                {coverPreview ? (
                  <Box>
                    <Box
                      component="img"
                      src={coverPreview}
                      alt="Blog cover preview"
                      sx={{
                        display: "block",
                        width: "100%",
                        maxHeight: 360,
                        objectFit: "cover",
                        borderRadius: 2,
                        bgcolor: "action.hover",
                      }}
                    />

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mt={1}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {coverFile?.name || "Current cover image"}
                      </Typography>

                      {coverFile && (
                        <Button
                          color="inherit"
                          onClick={handleRestoreCover}
                          disabled={loading}
                        >
                          Restore original
                        </Button>
                      )}
                    </Stack>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: "1px dashed",
                      borderColor: "divider",
                      borderRadius: 2,
                      p: { xs: 3, md: 5 },
                      textAlign: "center",
                      bgcolor: "action.hover",
                    }}
                  >
                    <CloudUploadOutlined
                      sx={{
                        fontSize: 42,
                        color: "text.secondary",
                        mb: 1,
                      }}
                    />

                    <Typography fontWeight={600}>
                      Choose a cover image
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Button
                    component="label"
                    variant="outlined"
                    disabled={loading}
                  >
                    {coverPreview ? "Change cover image" : "Choose image"}

                    <input
                      hidden
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      onChange={handleCoverChange}
                    />
                  </Button>
                </Box>
              </Stack>
            </Paper>

            {/* Blog content */}
            <Paper
              variant="outlined"
              sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Blog content
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Edit your existing content, add new images, and rearrange
                    your article.
                  </Typography>
                </Box>

                <Divider />

                <Editor
                  value={editorValue}
                  sessionId={sessionId}
                  onChangeValue={(json, html) => {
                    setEditorValue(json);
                    setHtmlOutput(html);
                  }}
                  uploadedImages={uploadedImages}
                  setUploadedImages={setUploadedImages}
                />
              </Stack>
            </Paper>

            {/* Publication settings */}
            <Paper
              variant="outlined"
              sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}
            >
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={600}>
                  Publication settings
                </Typography>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label={
                    <Box>
                      <Typography fontWeight={500}>Featured blog</Typography>

                      <Typography variant="body2" color="text.secondary">
                        Include this article in the featured blog section when
                        published.
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: "flex-start", m: 0 }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label={
                    <Box>
                      <Typography fontWeight={500}>
                        Publish immediately
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Published articles are visible through the public blog
                        API.
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: "flex-start", m: 0 }}
                />

                <Alert severity={published ? "success" : "info"}>
                  {published
                    ? "This blog will be published when you save it."
                    : "This blog will be saved as a draft."}
                </Alert>
              </Stack>
            </Paper>

            {/* Actions */}
            <Stack
              direction={{ xs: "column-reverse", sm: "row" }}
              justifyContent="flex-end"
              spacing={2}
            >
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate("/blogs")}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || sessionLoading || !sessionId}
              >
                {loading
                  ? "Updating blog..."
                  : published
                    ? "Update and publish"
                    : "Update blog"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
