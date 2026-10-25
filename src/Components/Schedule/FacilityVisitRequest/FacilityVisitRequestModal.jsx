import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { formatVisitDate, formatVisitTime } from "./facilityVisitUtils";
import StatusChip from "./StatusChip";
import PropTypes from "prop-types";

const STATUSES = ["Pending", "Approved", "Cancelled", "Completed", "Rejected"];
const ARCHIVED = ["Completed", "Cancelled", "Rejected"];

export default function FacilityVisitRequestModal({
  open,
  request,
  onClose,
  onSave,
  saving,
}) {
  const [status, setStatus] = useState("Pending");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setStatus(request?.status || "Pending");
    setRemark("");
    setError("");
    setMessage("");
  }, [request]);

  if (!request) return null;
  const archived = ARCHIVED.includes(request.status);

  async function submit() {
    if (status === request.status)
      return setError("Choose a different status.");
    if (!remark.trim())
      return setError("A remark is required for every status change.");
    if (remark.trim().length > 1000)
      return setError("Remark cannot exceed 1000 characters.");
    setError("");
    setMessage("");
    try {
      await onSave(request.id, status, remark.trim());
      setRemark("");
      setMessage("Status and remark saved successfully.");
    } catch (e) {
      setError(e?.message || "Unable to update status.");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Visit Request
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {request.id}
            </Typography>
          </Box>
          <StatusChip status={request.status} />
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Visitor
            </Typography>
            <Typography fontWeight={600}>{request.visitorName}</Typography>
            <Typography variant="body2">{request.email || "—"}</Typography>
            <Typography variant="body2">{request.phone || "—"}</Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Company
            </Typography>
            <Typography>{request.company}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Purpose
            </Typography>
            <Typography>{request.purpose || "—"}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Appointment
            </Typography>
            <Typography>{formatVisitDate(request.date)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatVisitTime(request.startTime)} –{" "}
              {formatVisitTime(request.endTime)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Notes
            </Typography>
            <Typography variant="body2">
              {request.notes || "No additional notes."}
            </Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="subtitle1" fontWeight={700} mb={1}>
              Status history
            </Typography>
            {!request.statusHistory?.length ? (
              <Typography variant="body2" color="text.secondary">
                No status changes recorded yet.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {[...request.statusHistory].reverse().map((item, i) => (
                  <Box
                    key={`${item.changedAt || i}-${i}`}
                    sx={{
                      p: 1.5,
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      {item.previousStatus || "New"} → {item.newStatus || "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.changedAt
                        ? new Date(item.changedAt).toLocaleString()
                        : ""}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mt: 1, whiteSpace: "pre-wrap" }}
                    >
                      {item.remark || "No remark recorded."}
                    </Typography>
                    {/* {item.changedBy && (
                      <Typography variant="caption" color="text.secondary">
                        Changed by: {item.changedBy}
                      </Typography>
                    )} */}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
          {!archived && (
            <>
              <Divider />
              <Typography variant="subtitle1" fontWeight={700}>
                Update status
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel id="request-status-label">Status</InputLabel>
                <Select
                  labelId="request-status-label"
                  label="Status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setError("");
                    setMessage("");
                  }}
                  disabled={saving}
                >
                  {STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                required
                multiline
                minRows={3}
                maxRows={6}
                label="Remark *"
                placeholder="Explain why this status is being changed..."
                value={remark}
                onChange={(e) => {
                  setRemark(e.target.value);
                  setError("");
                  setMessage("");
                }}
                inputProps={{ maxLength: 1000 }}
                helperText={`${remark.length}/1000 characters`}
                disabled={saving}
              />
              {error && <Alert severity="error">{error}</Alert>}
              {message && <Alert severity="success">{message}</Alert>}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Close
        </Button>
        {!archived && (
          <Button
            variant="contained"
            onClick={submit}
            disabled={saving || status === request.status || !remark.trim()}
            startIcon={
              saving ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {saving ? "Saving..." : "Save status"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
FacilityVisitRequestModal.propTypes = {
  open: PropTypes.bool.isRequired,
  request: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.string,
    visitorName: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    company: PropTypes.string,
    purpose: PropTypes.string,
    date: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    notes: PropTypes.string,
    statusHistory: PropTypes.arrayOf(
      PropTypes.shape({
        previousStatus: PropTypes.string,
        newStatus: PropTypes.string,
        remark: PropTypes.string,
        changedAt: PropTypes.string,
        changedBy: PropTypes.string,
      }),
    ),
  }),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
};
