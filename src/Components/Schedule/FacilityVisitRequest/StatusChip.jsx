import Chip from "@mui/material/Chip";
import PropTypes from "prop-types";

export default function StatusChip({ status }) {
  const colors = {
    Pending: "warning",
    Approved: "success",
    Completed: "default",
    Cancelled: "error",
    Rejected: "error",
  };

  return (
    <Chip
      size="small"
      label={status}
      color={colors[status] || "default"}
      variant={status === "Completed" ? "outlined" : "filled"}
    />
  );
}
StatusChip.propTypes = {
  status: PropTypes.string.isRequired,
};
