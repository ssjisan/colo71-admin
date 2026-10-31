import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import BlogInfo from "./components/BlogInfo";
import BlogEditor from "./components/BlogEditor";
import API from "../../../api/axios";

const MAX_COVER_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const EMPTY_CONTENT = [{ type: "paragraph", children: [{ text: "" }] }];

export default function BlogCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");

  const [editorValue, setEditorValue] = useState(EMPTY_CONTENT);
  const [htmlOutput, setHtmlOutput] = useState("");

  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [sessionLoading, setSessionLoading] = useState(true);

  // Initialize upload session
  useEffect(() => {
    let active = true;

    API.post("/blogs/upload-session")
      .then(({ data }) => {
        if (active) {
          setSessionId(data?.data?.sessionId || "");
        }
      })
      .catch((error) =>
        toast.error(
          error.response?.data?.message || "Could not start upload session.",
        ),
      )
      .finally(() => {
        if (active) setSessionLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Revoke cover preview URL
  useEffect(
    () => () => {
      if (coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    },
    [coverPreview],
  );

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return toast.error("Choose a JPG, PNG, WEBP, GIF, or AVIF image.");
    }

    if (file.size < 1 || file.size > MAX_COVER_SIZE) {
      return toast.error("Cover image must be 5 MB or smaller.");
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview("");
  };

  const handleEditorChange = (json, html) => {
    setEditorValue(json);
    setHtmlOutput(html);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      return toast.error("Blog title is required.");
    }

    if (
      !Array.isArray(editorValue) ||
      !editorValue.length ||
      !htmlOutput.trim()
    ) {
      return toast.error("Please add blog content before saving.");
    }

    if (!sessionId) {
      return toast.error("Upload session is not ready. Refresh and try again.");
    }

    const formData = new FormData();

    formData.append("title", title.trim());
    formData.append("excerpt", excerpt.trim());
    formData.append("contentJSON", JSON.stringify(editorValue));
    formData.append("featured", String(featured));
    formData.append("published", String(published));

    if (coverFile) {
      formData.append("coverPhoto", coverFile);
    }

    setLoading(true);

    try {
      const { data } = await API.post("/blogs", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-upload-session-id": sessionId,
        },
      });

      toast.success(data?.message || "Blog created successfully.");

      setSessionId("");
      navigate("/blogs");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to create the blog. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: "100px" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          {/* Page header */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Create Blog
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Write, configure, and publish a new blog post.
              </Typography>
            </Box>
          </Stack>

          {/* Upload status */}
          {sessionLoading && (
            <Alert severity="info">
              Preparing editor image upload session…
            </Alert>
          )}

          {!sessionLoading && !sessionId && (
            <Alert severity="error">
              Could not initialize image uploads. Refresh this page to try
              again.
            </Alert>
          )}

          {/* Main form */}
          <Box component="form" id="blog-create-form" onSubmit={handleSubmit}>
            {" "}
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
              {/* Left column */}
              <BlogInfo
                title={title}
                setTitle={setTitle}
                excerpt={excerpt}
                setExcerpt={setExcerpt}
                coverFile={coverFile}
                coverPreview={coverPreview}
                onCoverChange={handleCoverChange}
                onRemoveCover={handleRemoveCover}
                disabled={loading}
              />

              {/* Right column */}
              <BlogEditor
                editorValue={editorValue}
                onEditorChange={handleEditorChange}
                featured={featured}
                setFeatured={setFeatured}
                published={published}
                setPublished={setPublished}
                sessionId={sessionId}
                disabled={loading}
              />
            </Box>
          </Box>
        </Stack>
      </Container>

      {/* Fixed bottom action bar */}
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
        <Container maxWidth="xl">
          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            justifyContent="flex-end"
            spacing={1.5}
            sx={{
              py: 2,
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate(-1)}
              disabled={loading}
              fullWidth
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="blog-create-form"
              variant="contained"
              disabled={loading || sessionLoading || !sessionId}
              fullWidth
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {loading
                ? "Saving blog…"
                : published
                  ? "Create and publish"
                  : "Save as draft"}
            </Button>
          </Stack>
        </Container>
      </Paper>
    </Box>
  );
}
