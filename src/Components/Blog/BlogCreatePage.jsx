import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
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
  DeleteOutline,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
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
const EMPTY_CONTENT = [{ type: "paragraph", children: [{ text: "" }] }];

export default function BlogCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [editorValue, setEditorValue] = useState(EMPTY_CONTENT);
  const [htmlOutput, setHtmlOutput] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    let active = true;
    axios
      .post("/blogs/upload-session")
      .then(({ data }) => {
        if (active) setSessionId(data?.data?.sessionId || "");
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

  useEffect(
    () => () => {
      if (coverPreview.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    },
    [coverPreview],
  );

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type))
      return toast.error("Choose a JPG, PNG, WEBP, GIF, or AVIF image.");
    if (file.size < 1 || file.size > MAX_COVER_SIZE)
      return toast.error("Cover image must be 5 MB or smaller.");
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };
  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim()) return toast.error("Blog title is required.");
    if (
      !Array.isArray(editorValue) ||
      !editorValue.length ||
      !htmlOutput.trim()
    )
      return toast.error("Please add blog content before saving.");
    if (!sessionId)
      return toast.error("Upload session is not ready. Refresh and try again.");

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("excerpt", excerpt.trim());
    formData.append("contentJSON", JSON.stringify(editorValue));
    formData.append("featured", String(featured));
    formData.append("published", String(published));
    if (coverFile) formData.append("coverPhoto", coverFile);

    setLoading(true);
    try {
      const { data } = await axios.post("/blogs", formData, {
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
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
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
              Create Blog
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Write, configure, and publish a new blog post.
            </Typography>
          </Box>
          <Chip
            icon={<ArticleOutlined />}
            label="New article"
            variant="outlined"
          />
        </Stack>
        {sessionLoading && (
          <Alert severity="info">Preparing editor image upload session…</Alert>
        )}
        {!sessionLoading && !sessionId && (
          <Alert severity="error">
            Could not initialize image uploads. Refresh this page to try again.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
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
                />
              </Stack>
            </Paper>

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
                    JPG, PNG, WEBP, GIF, or AVIF. Maximum size: 5 MB. Uploaded
                    only when you save.
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
                        {coverFile?.name}
                      </Typography>
                      <Button
                        color="error"
                        startIcon={<DeleteOutline />}
                        onClick={handleRemoveCover}
                        disabled={loading}
                      >
                        Remove
                      </Button>
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
                      sx={{ fontSize: 42, color: "text.secondary", mb: 1 }}
                    />
                    <Typography fontWeight={600}>
                      Choose a cover image
                    </Typography>
                    <Button
                      component="label"
                      variant="outlined"
                      disabled={loading}
                      sx={{ mt: 2 }}
                    >
                      Choose image
                      <input
                        hidden
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        onChange={handleCoverChange}
                      />
                    </Button>
                  </Box>
                )}
              </Stack>
            </Paper>

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
                    Editor images are uploaded to a temporary session and moved
                    to permanent storage when you save.
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
            <Stack
              direction={{ xs: "column-reverse", sm: "row" }}
              justifyContent="flex-end"
              spacing={2}
            >
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate(-1)}
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
                  ? "Saving blog…"
                  : published
                    ? "Create and publish"
                    : "Save as draft"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
