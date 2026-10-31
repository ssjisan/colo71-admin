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
  blogs,
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";

    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) return "—";

    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  const StatusChip = ({
    active,
    activeLabel = "On",
    inactiveLabel = "Off",
  }) => (
    <Chip
      size="small"
      label={active ? activeLabel : inactiveLabel}
      color={active ? "success" : "default"}
      variant="outlined"
    />
  );

  return (
    <>
      <TableBody>
        {blogs.map((blog) => {
          const isPublished =
            Boolean(blog.published) || blog.status === "published";

          const isFeatured = Boolean(blog.featured);

          return (
            <TableRow key={blog._id} hover>
              {/* Blog title */}
              <TableCell
                sx={{
                  maxWidth: 350,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {blog.title || "Untitled"}
                </Typography>
              </TableCell>

              {/* Published */}
              <TableCell>
                <StatusChip active={isPublished} />
              </TableCell>

              {/* Featured */}
              <TableCell>
                <StatusChip active={isFeatured} />
              </TableCell>

              {/* Created date */}
              <TableCell>{formatDate(blog.createdAt)}</TableCell>

              {/* Actions */}
              {hasAnyAction && (
                <TableCell align="center">
                  <Tooltip title="Actions">
                    <IconButton
                      onClick={(event) => handleOpenMenu(event, blog)}
                    >
                      <Icon name="more" size={24} color="#919EAB" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>

      {/* Action menu */}
      <CustomePopOver
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleCloseMenu}
        menuItems={[
          {
            label: "Preview",
            iconName: "EyeBold",
            onClick: () => {
              navigate(`/blog-preview/${selectedRow?._id}`);
              handleCloseMenu();
            },
          },

          ...(canUpdate
            ? [
                {
                  label: "Edit",
                  iconName: "Edit",
                  onClick: () => {
                    navigate(`/edit-blog/${selectedRow?._id}`);
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
  blogs: PropTypes.array.isRequired,
  open: PropTypes.any,
  selectedRow: PropTypes.object,
  handleOpenMenu: PropTypes.func.isRequired,
  handleCloseMenu: PropTypes.func.isRequired,
  setIsModalOpen: PropTypes.func.isRequired,
  canUpdate: PropTypes.bool,
  canDelete: PropTypes.bool,
  hasAnyAction: PropTypes.bool,
};

Body.defaultProps = {
  canUpdate: false,
  canDelete: false,
  hasAnyAction: false,
};
