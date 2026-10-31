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
import toast from "react-hot-toast";
import CaseStudyInfo from "./components/CaseStudyInfo";
import CaseStudyEditor from "./components/CaseStudyEditor";
import axios from "../../../api/axios";

const MAX_COVER_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];
const EMPTY_CONTENT = [{ type: "paragraph", children: [{ text: "" }] }];
const SERVER_URL = (import.meta.env.VITE_SERVER_API || "").replace(/\/+$/, "");

const getImageUrl = (src) => {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return `${SERVER_URL}/${String(src).replace(/^\/+/, "")}`;
};

const parseContentJSON = (content) => {
  if (!content) return EMPTY_CONTENT;

  try {
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    return Array.isArray(parsed) && parsed.length ? parsed : EMPTY_CONTENT;
  } catch (error) {
    console.error("Could not parse case study content:", error);
    return EMPTY_CONTENT;
  }
};

export default function CaseStudyEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [clientName, setClientName] = useState("");
  const [industry, setIndustry] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [projectType, setProjectType] = useState("");
  const [editorValue, setEditorValue] = useState(EMPTY_CONTENT);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [originalCover, setOriginalCover] = useState("");
  const [coverRemoved, setCoverRemoved] = useState(false);

  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    let active = true;

    const initializePage = async () => {
      setPageLoading(true);
      setSessionLoading(true);

      try {
        const [caseResponse, sessionResponse] = await Promise.all([
          axios.get(`/case-studies/${id}`),
          axios.post("/case-studies/upload-session"),
        ]);

        if (!active) return;

        const responseData = caseResponse.data?.data;
        const item = responseData?.caseStudy || responseData;

        if (!item?._id) {
          throw new Error("Case study data was not found.");
        }

        setTitle(item.title || "");
        setSummary(item.summary || "");
        setClientName(item.clientName || "");
        setIndustry(item.industry || "");
        setProjectLocation(item.projectLocation || "");
        setProjectType(item.projectType || "");
        setCompletionDate(
          item.completionDate
            ? new Date(item.completionDate).toISOString().slice(0, 10)
            : "",
        );
        setEditorValue(parseContentJSON(item.contentJSON));
        setFeatured(Boolean(item.featured));
        setPublished(Boolean(item.published));

        // Keep compatibility with the current API field and the newer logo field.
        const existingLogo =
          item.companyLogo?.url ||
          item.companyLogo ||
          item.coverPhoto?.url ||
          item.coverPhoto ||
          "";
        const logoUrl = getImageUrl(existingLogo);

        setOriginalCover(logoUrl);
        setCoverPreview(logoUrl);
        setCoverRemoved(false);

        const newSessionId = sessionResponse.data?.data?.sessionId || "";
        if (!newSessionId) {
          throw new Error("Could not initialize the image upload session.");
        }

        setSessionId(newSessionId);
      } catch (error) {
        console.error("Case study edit initialization error:", error);
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Could not load case study.",
        );
      } finally {
        if (active) {
          setPageLoading(false);
          setSessionLoading(false);
        }
      }
    };

    if (id) initializePage();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Choose a JPG, PNG, WEBP, GIF, or AVIF image.");
      return;
    }

    if (file.size < 1 || file.size > MAX_COVER_SIZE) {
      toast.error("Company logo must be 5 MB or smaller.");
      return;
    }

    setCoverFile(file);
    setCoverRemoved(false);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview("");
    setCoverRemoved(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) return toast.error("Case study title is required.");
    if (!industry.trim()) return toast.error("Industry is required.");
    if (!projectType.trim()) return toast.error("Project type is required.");
    if (!Array.isArray(editorValue) || !editorValue.length) {
      return toast.error("Please add case study content.");
    }
    if (!sessionId) {
      return toast.error("Upload session is not ready. Please try again.");
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("summary", summary.trim());
    formData.append("clientName", clientName.trim());
    formData.append("industry", industry.trim());
    formData.append("projectLocation", projectLocation.trim());
    formData.append("completionDate", completionDate);
    formData.append("projectType", projectType.trim());
    formData.append("contentJSON", JSON.stringify(editorValue));
    formData.append("featured", String(featured));
    formData.append("published", String(published));

    // If the user chooses a new file, the backend should replace the old logo.
    // If removed, send an explicit flag so the update controller can delete it.
    if (coverFile) {
      formData.append("coverPhoto", coverFile);
    } else if (coverRemoved) {
      formData.append("removeCover", "true");
    }

    setLoading(true);

    try {
      const { data } = await axios.put(`/case-studies/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-upload-session-id": sessionId,
        },
      });

      toast.success(data?.message || "Case study updated successfully.");
      setSessionId("");
      navigate("/case-studies");
    } catch (error) {
      console.error("Case study update error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to update the case study. Please try again.",
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
            Loading case study information...
          </Typography>
        </Stack>
      </Container>
    );
  }

  if (!title && !sessionId) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Alert severity="error">
          Could not load this case study. Please check the ID and try again.
        </Alert>
        <Button onClick={() => navigate("/case-studies")} sx={{ mt: 2 }}>
          Back to case studies
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ pb: "100px" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Edit Case Study
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Update project details, content, images, and publication settings.
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

          <Box
            component="form"
            id="case-study-edit-form"
            onSubmit={handleSubmit}
          >
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
              <CaseStudyInfo
                title={title}
                setTitle={setTitle}
                summary={summary}
                setSummary={setSummary}
                clientName={clientName}
                setClientName={setClientName}
                industry={industry}
                setIndustry={setIndustry}
                projectLocation={projectLocation}
                setProjectLocation={setProjectLocation}
                completionDate={completionDate}
                setCompletionDate={setCompletionDate}
                projectType={projectType}
                setProjectType={setProjectType}
                coverFile={coverFile}
                coverPreview={coverPreview}
                onCoverChange={handleCoverChange}
                onRemoveCover={handleRemoveCover}
                disabled={loading}
              />

              <CaseStudyEditor
                editorValue={editorValue}
                onEditorChange={setEditorValue}
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
                  onClick={() => navigate("/case-studies")}
                  disabled={loading}
                  fullWidth
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  form="case-study-edit-form"
                  variant="contained"
                  disabled={loading || sessionLoading || !sessionId}
                  fullWidth
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  {loading
                    ? "Updating case study..."
                    : published
                      ? "Update and publish"
                      : "Update case study"}
                </Button>
              </Stack>
            </Container>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
