import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import FacilityVisitRequestsTable from "../../Components/Schedule/FacilityVisitRequest/FacilityVisitRequestsTable";
import FacilityVisitRequestModal from "../../Components/Schedule/FacilityVisitRequest/FacilityVisitRequestModal";

const API_BASE_URL = (import.meta.env.VITE_SERVER_API || "").replace(/\/$/, "");
const ARCHIVED_STATUSES = ["Completed", "Cancelled", "Rejected"];

async function apiRequest(path, options = {}) {
  if (!API_BASE_URL)
    throw new Error("VITE_SERVER_API is not configured in your .env file.");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false)
    throw new Error(data.message || `Request failed (${response.status}).`);
  return data;
}

function addMinutes(time, minutes) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function normalizeRequest(item, slotDuration = 30) {
  const status = item.status || "Pending";
  return {
    ...item,
    id: String(item._id || item.id || ""),
    visitorName: item.name || item.visitorName || "Unknown visitor",
    company: item.organization || item.company || "—",
    date: item.visitDate || item.date || "",
    startTime: item.visitTime || item.startTime || "",
    endTime:
      item.endTime ||
      addMinutes(item.visitTime || item.startTime, slotDuration),
    status: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
    statusHistory: Array.isArray(item.statusHistory) ? item.statusHistory : [],
    notes: item.notes || "",
  };
}

export default function FacilityVisitRequests() {
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const month = new Date().toISOString().slice(0, 7);
      const [upcomingResult, archiveResult, settingsResult] = await Promise.all(
        [
          apiRequest("/facility-visits/admin/upcoming"),
          apiRequest(`/facility-visits/admin/archive?month=${month}`),
          apiRequest("/facility-visits/admin/settings").catch(() => ({
            settings: {},
          })),
        ],
      );
      const duration =
        Number(settingsResult.settings?.slotDurationMinutes) || 30;
      const all = [
        ...(upcomingResult.requests || []),
        ...(archiveResult.requests || []),
      ].map((item) => normalizeRequest(item, duration));
      const unique = [...new Map(all.map((item) => [item.id, item])).values()];
      setRequests(unique);
      setSelectedRequest((current) =>
        current
          ? unique.find((item) => item.id === current.id) || current
          : null,
      );
    } catch (e) {
      setError(e?.message || "Unable to load facility visit requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const upcoming = useMemo(
    () => requests.filter((r) => !ARCHIVED_STATUSES.includes(r.status)),
    [requests],
  );
  const archived = useMemo(
    () => requests.filter((r) => ARCHIVED_STATUSES.includes(r.status)),
    [requests],
  );
  const query = search.trim().toLowerCase();
  const visibleRequests = (tab === 0 ? upcoming : archived).filter((r) =>
    [r.id, r.visitorName, r.company, r.email, r.purpose, r.status].some(
      (value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
    ),
  );

  async function saveStatus(id, status, remark) {
    setSavingStatus(true);
    try {
      const result = await apiRequest(
        `/facility-visits/admin/requests/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, remark }),
        },
      );
      const raw = result.request || result.data?.request;
      if (!raw)
        throw new Error("The server did not return the updated request.");
      const updated = normalizeRequest(raw);
      setRequests((current) =>
        current.map((r) => (r.id === id ? { ...r, ...updated } : r)),
      );
      setSelectedRequest(updated);
      await loadRequests();
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, width: "100%" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Facility Visit Requests
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.75}>
            Review requests and manage their status.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={loadRequests} disabled={loading}>
          Refresh requests
        </Button>
      </Stack>

      {loading && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          icon={<CircularProgress size={18} />}
        >
          Loading requests…
        </Alert>
      )}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" onClick={loadRequests}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          ["Upcoming & Active", upcoming.length],
          [
            "Pending Approval",
            requests.filter((r) => r.status === "Pending").length,
          ],
          [
            "Approved Visits",
            requests.filter((r) => r.status === "Approved").length,
          ],
        ].map(([title, value]) => (
          <Paper
            key={title}
            variant="outlined"
            sx={{ p: 2.5, borderRadius: 2 }}
          >
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ my: 1 }}>
              {value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <FacilityVisitRequestsTable
        tab={tab}
        setTab={setTab}
        search={search}
        setSearch={setSearch}
        upcomingCount={upcoming.length}
        archiveCount={archived.length}
        requests={visibleRequests}
        onView={setSelectedRequest}
      />
      <FacilityVisitRequestModal
        open={Boolean(selectedRequest)}
        request={selectedRequest}
        saving={savingStatus}
        onClose={() => setSelectedRequest(null)}
        onSave={saveStatus}
      />
    </Box>
  );
}
