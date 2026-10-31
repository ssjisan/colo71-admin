import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  LocationOn,
  Business,
  Category,
} from "@mui/icons-material";
import ContentRenderer from "../../lib/html2text";
import API from "../../api/axios";

const SERVER_URL = (import.meta.env.VITE_SERVER_API || "").replace(/\/+$/, "");

const getImageUrl = (url) => {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${SERVER_URL}/${url.replace(/^\/+/, "")}`;
};

export default function CaseStudyPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseStudy, setCaseStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await API.get(`/case-studies/${id}`);
        const payload = response.data?.data;
        if (active) setCaseStudy(payload?.caseStudy || payload);
      } catch (err) {
        if (active)
          setError(
            err.response?.data?.message ||
              "Unable to load this case study. Please try again.",
          );
      } finally {
        if (active) setLoading(false);
      }
    };
    if (id) fetchItem();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading)
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
  if (error || !caseStudy)
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Case study not found."}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );

  const completion = caseStudy.completionDate
    ? new Date(caseStudy.completionDate)
    : null;
  const dateLabel =
    completion && !Number.isNaN(completion.getTime())
      ? completion.toLocaleDateString()
      : "Not specified";

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">
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
              onClick={() => navigate("/case-studies")}
            >
              Case Studies
            </Typography>
            <Typography color="text.primary">Preview</Typography>
          </Breadcrumbs>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </Stack>
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            maxWidth: 1000,
            mx: "auto",
            overflow: "hidden",
            borderRadius: 3,
          }}
        >
          {caseStudy.coverPhoto && (
            <Box
              component="img"
              src={getImageUrl(
                caseStudy.coverPhoto?.url || caseStudy.coverPhoto,
              )}
              alt={caseStudy.title}
              sx={{
                display: "block",
                width: "100%",
                maxHeight: 460,
                objectFit: "cover",
              }}
            />
          )}
          <Box sx={{ p: { xs: 2.5, md: 5 } }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {caseStudy.published ? (
                <Alert severity="success" icon={false} sx={{ py: 0 }}>
                  Published
                </Alert>
              ) : (
                <Alert severity="warning" icon={false} sx={{ py: 0 }}>
                  Draft
                </Alert>
              )}
              {caseStudy.featured && (
                <Alert severity="info" icon={false} sx={{ py: 0 }}>
                  Featured
                </Alert>
              )}
            </Stack>
            <Typography
              variant="h3"
              component="h1"
              fontWeight={700}
              sx={{
                mb: 2,
                lineHeight: 1.25,
                fontSize: { xs: "1.8rem", md: "2.5rem" },
              }}
            >
              {caseStudy.title}
            </Typography>
            {caseStudy.summary && (
              <Typography
                variant="h6"
                color="text.secondary"
                fontWeight={400}
                sx={{ mb: 3, lineHeight: 1.7 }}
              >
                {caseStudy.summary}
              </Typography>
            )}
            <Stack
              direction="row"
              flexWrap="wrap"
              gap={2.5}
              alignItems="center"
              sx={{ mb: 4 }}
            >
              {caseStudy.clientName && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Business fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {caseStudy.clientName}
                  </Typography>
                </Stack>
              )}
              {caseStudy.industry && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Category fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {caseStudy.industry}
                  </Typography>
                </Stack>
              )}
              {caseStudy.projectLocation && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {caseStudy.projectLocation}
                  </Typography>
                </Stack>
              )}
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarToday fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Completed: {dateLabel}
                </Typography>
              </Stack>
              {caseStudy.projectType && (
                <Typography variant="body2" color="text.secondary">
                  Project type: {caseStudy.projectType}
                </Typography>
              )}
            </Stack>
            <Divider sx={{ mb: 4 }} />
            <Box
              sx={{
                "& p": { fontSize: "1rem", lineHeight: 1.9 },
                "& img": { maxWidth: "100%" },
              }}
            >
              <ContentRenderer html={caseStudy.contentHTML} />
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
