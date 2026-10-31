import {
  Box,
  Button,
  InputAdornment,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import PropTypes from "prop-types";
import { formatVisitDate, formatVisitTime } from "./facilityVisitUtils";
import StatusChip from "./StatusChip";

export default function FacilityVisitRequestsTable({
  tab,
  setTab,
  search,
  setSearch,
  upcomingCount,
  archiveCount,
  requests,
  onView,
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
      <Tabs
        value={tab}
        onChange={(_, value) => {
          setTab(value);
          setSearch("");
        }}
        sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          label={`Upcoming & Active (${upcomingCount})`}
          sx={{ textTransform: "none" }}
        />
        <Tab
          label={`Archive (${archiveCount})`}
          sx={{ textTransform: "none" }}
        />
      </Tabs>

      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Typography fontWeight={700}>
          {tab === 0 ? "Upcoming & Active Visits" : "Archived Visits"}
        </Typography>

        <TextField
          size="small"
          placeholder="Search requests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: "100%", sm: 300 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">⌕</InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Visitor</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Visit Date & Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id} hover>
                <TableCell>
                  <Typography fontWeight={600} variant="body2">
                    {request.visitorName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {request.email}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {request.company || "—"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {formatVisitDate(request.date)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatVisitTime(request.startTime)} –{" "}
                    {formatVisitTime(request.endTime)}
                  </Typography>
                </TableCell>

                <TableCell>
                  <StatusChip status={request.status} />
                </TableCell>

                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onView(request)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {!requests.length && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Box sx={{ py: 5, textAlign: "center" }}>
                    <Typography fontWeight={600}>No requests found</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try another search or select a different tab.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

FacilityVisitRequestsTable.propTypes = {
  tab: PropTypes.number.isRequired,
  setTab: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
  setSearch: PropTypes.func.isRequired,
  upcomingCount: PropTypes.number.isRequired,
  archiveCount: PropTypes.number.isRequired,
  requests: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      company: PropTypes.string,
      visitorName: PropTypes.string,
      email: PropTypes.string,
      date: PropTypes.string,
      startTime: PropTypes.string,
      endTime: PropTypes.string,
      status: PropTypes.string,
    }),
  ).isRequired,
  onView: PropTypes.func.isRequired,
};
