import { useCallback, useEffect, useContext, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Icon from "../../Icon";
import SetupModal from "./SetupModal";
import { hasPermission } from "../../../lib/hasPermission";
import { DataContext } from "../../../DataProcessing/DataProcessing";
import API from "../../../api/axios";

const DAYS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

function InfoCard({ label, value, description }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        height: "100%",
        borderRadius: 2,
        minWidth: 0,
      }}
    >
      <Typography variant="body2" color="text.secondary" mb={1}>
        {label}
      </Typography>

      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ overflowWrap: "anywhere" }}
      >
        {value}
      </Typography>

      {description && (
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={1}
        >
          {description}
        </Typography>
      )}
    </Paper>
  );
}

export default function ScheduleManagement() {
  const { auth } = useContext(DataContext);

  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canUpdate = hasPermission(
    auth?.permissions,
    "schedule-management",
    "canUpdate",
  );

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/facility-visits/admin/settings");

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load schedule settings.",
        );
      }

      const data = response.data.settings;

      if (!data) {
        setSettings(null);
        return;
      }

      const cleanSettings = { ...data };
      delete cleanSettings.timezone;
      setSettings(cleanSettings);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load schedule settings.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const workingDays = DAYS.filter((day) =>
    settings?.workingDays?.includes(day.value),
  );

  const blockedDates = settings?.blockedDates || [];
  const notificationEmails = settings?.notificationEmails || [];

  const handleSaved = (updatedSettings) => {
    if (updatedSettings) {
      const cleanSettings = { ...updatedSettings };
      delete cleanSettings.timezone;
      setSettings(cleanSettings);
      setSettings(cleanSettings);
    } else {
      loadSettings();
    }

    setOpen(false);
  };

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
            Schedule Management
          </Typography>

          <Typography variant="body2" color="text.secondary" mt={0.75}>
            Configure working days, appointment hours, visitor request limits,
            and notification recipients.
          </Typography>
        </Box>

        {canUpdate && (
          <Button
            variant="contained"
            onClick={() => setOpen(true)}
            startIcon={<Icon name="edit" size="16px" color="#fff" />}
            sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
          >
            Edit schedule
          </Button>
        )}
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={loadSettings}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : settings ? (
        <Stack spacing={3}>
          {/* Schedule overview */}
          <Box>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Current Schedule
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <InfoCard
                label="Opening Time"
                value={settings.startTime || "—"}
                description="Start of the daily appointment schedule"
              />

              <InfoCard
                label="Closing Time"
                value={settings.endTime || "—"}
                description="End of the daily appointment schedule"
              />

              <InfoCard
                label="Slot Duration"
                value={
                  settings.slotDurationMinutes != null
                    ? `${settings.slotDurationMinutes} min`
                    : "—"
                }
                description="Duration of each appointment slot"
              />

              <InfoCard
                label="Visitors Per Slot"
                value={settings.capacityPerSlot ?? "—"}
                description="Maximum requests allowed in one time slot"
              />

              <InfoCard
                label="Maximum Requests Per Day"
                value={settings.maxRequestsPerDay ?? "—"}
                description="Maximum total requests accepted across all slots in one day"
              />
            </Box>
          </Box>

          {/* Working days */}
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}
          >
            <Typography variant="h6" fontWeight={700} mb={1}>
              Working Days
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={2}>
              Appointments can be requested on the following days.
            </Typography>

            {workingDays.length > 0 ? (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {workingDays.map((day) => (
                  <Chip
                    key={day.value}
                    label={day.label}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                No working days configured.
              </Typography>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="body2" color="text.secondary">
              Each day follows the configured opening hours, slot duration, and
              request limits above.
            </Typography>
          </Paper>

          {/* Blocked dates */}
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}
          >
            <Typography variant="h6" fontWeight={700} mb={1}>
              Blocked Dates
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={2}>
              No appointment requests will be accepted on these dates.
            </Typography>

            {blockedDates.length > 0 ? (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {[...blockedDates].sort().map((date) => (
                  <Chip key={date} label={date} />
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                No blocked dates configured.
              </Typography>
            )}
          </Paper>

          {/* Notification email group */}
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}
          >
            <Typography variant="h6" fontWeight={700} mb={1}>
              Notification Email Group
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={2}>
              These recipients receive an email when a visitor submits a new
              facility visit request.
            </Typography>

            {notificationEmails.length > 0 ? (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {notificationEmails.map((email) => (
                  <Chip
                    key={email}
                    label={email}
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Stack>
            ) : (
              <Alert severity="info">
                No notification recipients configured. Add email addresses using
                Edit schedule.
              </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="body2" color="text.secondary">
              The visitor acknowledgement email is sent separately to the
              visitor who submitted the request.
            </Typography>
          </Paper>
        </Stack>
      ) : (
        <Alert severity="info">No schedule settings are available.</Alert>
      )}

      <SetupModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={handleSaved}
      />
    </Box>
  );
}

InfoCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  description: PropTypes.string,
};
