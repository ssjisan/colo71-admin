import {
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Chip,
  Typography,
} from "@mui/material";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import CustomePopOver from "../../Common/PopOver/CustomePopOver";
import Icon from "../../Icon";

export default function Body({
  caseStudies,
  open,
  selectedRow,
  handleOpenMenu,
  handleCloseMenu,
  setIsModalOpen,
  canUpdate,
  canDelete,
  hasAnyAction,
}) {
  const navigate = useNavigate();
  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
  };
  const StatusChip = ({ active }) => (
    <Chip
      size="small"
      label={active ? "On" : "Off"}
      color={active ? "success" : "default"}
      variant="outlined"
    />
  );
  return (
    <>
      <TableBody>
        {caseStudies.map((item) => (
          <TableRow key={item._id} hover>
            <TableCell
              sx={{
                maxWidth: 320,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {item.title || "Untitled"}
              </Typography>
            </TableCell>
            <TableCell>{item.industry || "—"}</TableCell>
            <TableCell>{item.projectType || "—"}</TableCell>
            <TableCell>
              <StatusChip active={Boolean(item.published)} />
            </TableCell>
            <TableCell>
              <StatusChip active={Boolean(item.featured)} />
            </TableCell>
            <TableCell>{formatDate(item.createdAt)}</TableCell>
            {hasAnyAction && (
              <TableCell align="center">
                <Tooltip title="Actions">
                  <IconButton onClick={(event) => handleOpenMenu(event, item)}>
                    <Icon name="more" size={24} color="#919EAB" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
      <CustomePopOver
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleCloseMenu}
        menuItems={[
          {
            label: "Preview",
            iconName: "EyeBold",
            onClick: () => {
              navigate(`/case-study-preview/${selectedRow?._id}`);
              handleCloseMenu();
            },
          },
          ...(canUpdate
            ? [
                {
                  label: "Edit",
                  iconName: "Edit",
                  onClick: () => {
                    navigate(`/edit-case-study/${selectedRow?._id}`);
                    handleCloseMenu();
                  },
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  label: "Delete",
                  iconName: "Remove",
                  color: "error",
                  onClick: () => {
                    setIsModalOpen(true);
                    handleCloseMenu();
                  },
                },
              ]
            : []),
        ]}
      />
    </>
  );
}
Body.propTypes = {
  caseStudies: PropTypes.array.isRequired,
  open: PropTypes.any,
  selectedRow: PropTypes.object,
  handleOpenMenu: PropTypes.func.isRequired,
  handleCloseMenu: PropTypes.func.isRequired,
  setIsModalOpen: PropTypes.func.isRequired,
  canUpdate: PropTypes.bool,
  canDelete: PropTypes.bool,
  hasAnyAction: PropTypes.bool,
};
