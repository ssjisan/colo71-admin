import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";
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

const DEFAULT_SETTINGS = {
  workingDays: [1, 2, 3, 4, 5],
  startTime: "09:00",
  endTime: "17:00",
  slotDurationMinutes: 30,
  capacityPerSlot: 1,
  maxRequestsPerDay: 10,
  blockedDates: [],
  notificationEmails: [],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SetupModal({ open, onClose, onSaved }) {
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [blockedDate, setBlockedDate] = useState("");
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    if (!open) return;

    let active = true;

    const loadSettings = async () => {
      setLoading(true);
      setError("");
      setEmailInput("");

      try {
        const response = await API.get("/facility-visits/admin/settings");

        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Failed to load schedule settings.",
          );
        }

        const savedSettings = response.data.settings || {};
        const settingsWithoutTimezone = { ...savedSettings };
        delete settingsWithoutTimezone.timezone;

        if (!active) return;

        setSettings({
          ...DEFAULT_SETTINGS,
          ...settingsWithoutTimezone,
          workingDays:
            savedSettings.workingDays ?? DEFAULT_SETTINGS.workingDays,
          slotDurationMinutes: Number(
            savedSettings.slotDurationMinutes ??
              DEFAULT_SETTINGS.slotDurationMinutes,
          ),
          capacityPerSlot: Number(
            savedSettings.capacityPerSlot ?? DEFAULT_SETTINGS.capacityPerSlot,
          ),
          maxRequestsPerDay: Number(
            savedSettings.maxRequestsPerDay ??
              DEFAULT_SETTINGS.maxRequestsPerDay,
          ),
          blockedDates: savedSettings.blockedDates ?? [],
          notificationEmails: Array.isArray(savedSettings.notificationEmails)
            ? savedSettings.notificationEmails
            : [],
        });
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load schedule settings.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, [open]);

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWorkingDayChange = (day, checked) => {
    setSettings((prev) => ({
      ...prev,
      workingDays: checked
        ? [...new Set([...prev.workingDays, day])].sort((a, b) => a - b)
        : prev.workingDays.filter((value) => value !== day),
    }));
  };

  const handleAddBlockedDate = () => {
    if (!blockedDate || settings.blockedDates.includes(blockedDate)) return;

    handleChange(
      "blockedDates",
      [...settings.blockedDates, blockedDate].sort(),
    );
    setBlockedDate("");
  };

  const handleRemoveBlockedDate = (date) => {
    handleChange(
      "blockedDates",
      settings.blockedDates.filter((item) => item !== date),
    );
  };

  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();

    if (!email) return;

    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (
      settings.notificationEmails.some(
        (existingEmail) => existingEmail.toLowerCase() === email,
      )
    ) {
      setError("This email address has already been added.");
      return;
    }

    setError("");
    handleChange("notificationEmails", [...settings.notificationEmails, email]);
    setEmailInput("");
  };

  const handleRemoveEmail = (emailToRemove) => {
    handleChange(
      "notificationEmails",
      settings.notificationEmails.filter((email) => email !== emailToRemove),
    );
  };

  const handleEmailKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddEmail();
    }
  };

  const handleSave = async () => {
    setError("");

    if (settings.workingDays.length === 0) {
      setError("Select at least one working day.");
      return;
    }

    if (!settings.startTime || !settings.endTime) {
      setError("Please provide both start and end times.");
      return;
    }

    if (settings.startTime >= settings.endTime) {
      setError("End time must be later than start time.");
      return;
    }

    const slotDurationMinutes = Number(settings.slotDurationMinutes);
    const capacityPerSlot = Number(settings.capacityPerSlot);
    const maxRequestsPerDay = Number(settings.maxRequestsPerDay);

    if (
      !Number.isInteger(slotDurationMinutes) ||
      slotDurationMinutes < 5 ||
      slotDurationMinutes > 240
    ) {
      setError("Slot duration must be between 5 and 240 minutes.");
      return;
    }

    if (
      !Number.isInteger(capacityPerSlot) ||
      capacityPerSlot < 1 ||
      capacityPerSlot > 100
    ) {
      setError("Visitors per slot must be between 1 and 100.");
      return;
    }

    if (
      !Number.isInteger(maxRequestsPerDay) ||
      maxRequestsPerDay < 1 ||
      maxRequestsPerDay > 500
    ) {
      setError("Maximum requests per day must be between 1 and 500.");
      return;
    }

    const normalizedEmails = [
      ...new Set(
        settings.notificationEmails.map((email) => email.trim().toLowerCase()),
      ),
    ];

    if (!normalizedEmails.every((email) => EMAIL_RE.test(email))) {
      setError("Please remove any invalid notification email addresses.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        workingDays: settings.workingDays,
        startTime: settings.startTime,
        endTime: settings.endTime,
        slotDurationMinutes,
        capacityPerSlot,
        maxRequestsPerDay,
        blockedDates: settings.blockedDates,
        notificationEmails: normalizedEmails,
      };

      const response = await API.patch(
        "/facility-visits/admin/settings",
        payload,
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to save schedule settings.",
        );
      }

      const savedSettings = response.data.settings
        ? {
            ...DEFAULT_SETTINGS,
            ...response.data.settings,
            timezone: undefined,
            notificationEmails:
              response.data.settings.notificationEmails ?? normalizedEmails,
          }
        : payload;

      onSaved?.(savedSettings);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save schedule settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        Setup Appointment Schedule
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            {/* Working days */}
            <Box>
              <Typography fontWeight={600} mb={1}>
                Working Days
              </Typography>

              <FormGroup>
                {DAYS.map((day) => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Checkbox
                        checked={settings.workingDays.includes(day.value)}
                        onChange={(event) =>
                          handleWorkingDayChange(
                            day.value,
                            event.target.checked,
                          )
                        }
                      />
                    }
                    label={day.label}
                  />
                ))}
              </FormGroup>
            </Box>

            {/* Opening and closing times */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={settings.startTime}
                onChange={(event) =>
                  handleChange("startTime", event.target.value)
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={settings.endTime}
                onChange={(event) =>
                  handleChange("endTime", event.target.value)
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>

            {/* Slot configuration */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="slot-duration-label">Slot Duration</InputLabel>

                <Select
                  labelId="slot-duration-label"
                  value={Number(settings.slotDurationMinutes)}
                  label="Slot Duration"
                  onChange={(event) =>
                    handleChange(
                      "slotDurationMinutes",
                      Number(event.target.value),
                    )
                  }
                >
                  <MenuItem value={15}>15 minutes</MenuItem>
                  <MenuItem value={30}>30 minutes</MenuItem>
                  <MenuItem value={45}>45 minutes</MenuItem>
                  <MenuItem value={60}>60 minutes</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label="Visitors Per Slot"
                value={settings.capacityPerSlot}
                onChange={(event) =>
                  handleChange("capacityPerSlot", event.target.value)
                }
                slotProps={{
                  htmlInput: { min: 1, max: 100, step: 1 },
                }}
                helperText="Maximum requests accepted for one time slot."
              />
            </Stack>

            <TextField
              fullWidth
              type="number"
              label="Maximum Requests Per Day"
              value={settings.maxRequestsPerDay}
              onChange={(event) =>
                handleChange("maxRequestsPerDay", event.target.value)
              }
              slotProps={{
                htmlInput: { min: 1, max: 500, step: 1 },
              }}
              helperText="Maximum requests accepted across all time slots in one day."
            />

            {/* Blocked dates */}
            <Box>
              <Typography fontWeight={600} mb={1}>
                Blocked Dates
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "flex-start" }}
              >
                <TextField
                  fullWidth
                  type="date"
                  label="Select date"
                  value={blockedDate}
                  onChange={(event) => setBlockedDate(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />

                <Button
                  variant="outlined"
                  onClick={handleAddBlockedDate}
                  disabled={
                    !blockedDate || settings.blockedDates.includes(blockedDate)
                  }
                  sx={{ minHeight: 56, flexShrink: 0 }}
                >
                  Add
                </Button>
              </Stack>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                {settings.blockedDates.map((date) => (
                  <Chip
                    key={date}
                    label={date}
                    onDelete={() => handleRemoveBlockedDate(date)}
                  />
                ))}

                {settings.blockedDates.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No blocked dates added.
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider />

            {/* Notification email group */}
            <Box>
              <Typography fontWeight={600} mb={1}>
                Notification Email Group
              </Typography>

              <Typography variant="body2" color="text.secondary" mb={2}>
                Add the email addresses that should receive a notification
                whenever a visitor submits a new facility visit request.
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "flex-start" }}
              >
                <TextField
                  fullWidth
                  type="email"
                  label="Notification Email"
                  placeholder="security@example.com"
                  value={emailInput}
                  onChange={(event) => {
                    setEmailInput(event.target.value);
                    if (error) setError("");
                  }}
                  onKeyDown={handleEmailKeyDown}
                  slotProps={{
                    htmlInput: {
                      "aria-label": "Notification email address",
                    },
                  }}
                  helperText="Press Enter or click Add to include an address."
                />

                <Button
                  variant="outlined"
                  onClick={handleAddEmail}
                  disabled={!emailInput.trim()}
                  sx={{ minHeight: 56, flexShrink: 0 }}
                >
                  Add
                </Button>
              </Stack>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                {settings.notificationEmails.map((email) => (
                  <Chip
                    key={email}
                    label={email}
                    variant="outlined"
                    color="primary"
                    onDelete={() => handleRemoveEmail(email)}
                  />
                ))}

                {settings.notificationEmails.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No notification emails added.
                  </Typography>
                )}
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

SetupModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func,
};
