import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import Icon from "../Icon";
import API from "../../api/axios";
import CustomePopOver from "../Common/PopOver/CustomePopOver";
import AlbumImageViewer from "./AlbumImageViewer";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "../Common/RemoveConfirmation/ConfirmationModal";
export default function AlbumListView({ onViewAlbum, onDeleteAlbum }) {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  const [viewAlbum, setViewAlbum] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const open = Boolean(anchorEl);

  const fetchAlbums = useCallback(async () => {
    setLoading(true);

    try {
      const response = await API.get("/admin");
      const result = response.data?.data;

      const albumList = Array.isArray(result)
        ? result
        : Array.isArray(result?.albums)
          ? result.albums
          : Array.isArray(response.data?.albums)
            ? response.data.albums
            : [];

      setAlbums(albumList);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load albums.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const handleOpenMenu = (event, album) => {
    setAnchorEl(event.currentTarget);
    setSelectedAlbum(album);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleViewAlbum = (album) => {
    setViewAlbum(album);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setViewAlbum(null);
  };

  const menuItems = [
    {
      label: "View",
      iconName: "eyebold",
      onClick: () => {
        if (selectedAlbum) {
          handleViewAlbum(selectedAlbum);
          onViewAlbum?.(selectedAlbum);
        }
        handleCloseMenu();
      },
      color: "#838383",
    },
    {
      label: "Edit",
      iconName: "Edit",
      onClick: () => {
        if (selectedAlbum?._id) {
          navigate(`/edit-album/${selectedAlbum._id}`);
        }
        handleCloseMenu();
      },
      color: "#838383",
    },
    {
      label: "Delete",
      iconName: "Delete",
      onClick: () => {
        if (selectedAlbum) {
          setDeleteItem(selectedAlbum);
          setOpenConfirm(true);
        }
        handleCloseMenu();
      },
      color: "error",
    },
  ];

  const getAlbumName = (album) => album.name || album.title || "Untitled album";

  const getThumbnail = (album) => {
    const thumbnail = album.thumbnail;

    const imagePath =
      typeof thumbnail === "string"
        ? thumbnail
        : thumbnail?.url || thumbnail?.path || thumbnail?.filename || "";

    if (!imagePath) return "";

    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath;
    }

    const baseURL = (API.defaults.baseURL || "").replace(/\/+$/, "");
    const cleanPath = imagePath.replace(/^\/+/, "");

    if (cleanPath.startsWith("file-storage/")) {
      return `${baseURL}/${cleanPath}`;
    }

    if (cleanPath.startsWith("gallery/")) {
      return `${baseURL}/file-storage/${cleanPath}`;
    }

    return `${baseURL}/file-storage/${cleanPath}`;
  };

  const getImageCount = (album) =>
    Array.isArray(album.images) ? album.images.length : (album.imageCount ?? 0);

  const getDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  };
  const handleDelete = async () => {
    if (!deleteItem?._id || deleting) return;

    setDeleting(true);

    try {
      const response = await API.delete(`/delete-album/${deleteItem._id}`);

      toast.success(response.data?.message || "Album deleted successfully.");

      setAlbums((current) =>
        current.filter((album) => album._id !== deleteItem._id),
      );

      setOpenConfirm(false);
      setDeleteItem(null);

      // Return to a valid page if the last album on this page was deleted.
      setPage((currentPage) => {
        const remainingCount = albums.length - 1;
        const lastPage = Math.max(
          0,
          Math.ceil(remainingCount / rowsPerPage) - 1,
        );

        return Math.min(currentPage, lastPage);
      });

      onDeleteAlbum?.(deleteItem);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete album.");
    } finally {
      setDeleting(false);
    }
  };
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Gallery Albums
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your gallery albums and their images.
          </Typography>
        </Box>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Album</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell align="center">Images</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Loading albums...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : albums.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" fontWeight={500}>
                    No albums found
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Create an album to see it listed here.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              albums
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((album) => (
                  <TableRow hover key={album._id || album.id || album.slug}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          variant="rounded"
                          src={getThumbnail(album)}
                          alt={getAlbumName(album)}
                          sx={{
                            width: 56,
                            height: 48,
                            bgcolor: "grey.100",
                            borderRadius: 1,
                          }}
                        />

                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {getAlbumName(album)}
                          </Typography>

                          {album.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {album.description}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {album.slug || "—"}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={getImageCount(album)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={album.status || "Published"}
                        size="small"
                        color={
                          album.status === "draft" || album.status === "pending"
                            ? "warning"
                            : "success"
                        }
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getDate(album.createdAt || album.created_at)}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <IconButton
                        aria-label={`Actions for ${getAlbumName(album)}`}
                        onClick={(event) => handleOpenMenu(event, album)}
                      >
                        <Icon name="More" size={20} color="#919EAB" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>

        {!loading && albums.length > 0 && (
          <TablePagination
            component="div"
            count={albums.length}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        )}
      </TableContainer>

      <CustomePopOver
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseMenu}
        menuItems={menuItems}
      />

      <AlbumImageViewer
        open={viewerOpen}
        album={viewAlbum}
        onClose={handleCloseViewer}
      />
      <ConfirmationModal
        open={openConfirm}
        title="Delete Album"
        itemName={deleteItem?.name || deleteItem?.title || "Untitled album"}
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>
              &quot;{deleteItem?.name || deleteItem?.title || "Untitled album"}
              &quot;
            </strong>
            ? This action cannot be undone.
          </>
        }
        confirmLabel={deleting ? "Deleting..." : "Yes, Delete"}
        onClose={() => {
          if (deleting) return;
          setOpenConfirm(false);
          setDeleteItem(null);
        }}
        onConfirm={handleDelete}
      />
    </Box>
  );
}

AlbumListView.propTypes = {
  onViewAlbum: PropTypes.func,
  onEditAlbum: PropTypes.func,
  onDeleteAlbum: PropTypes.func,
};

AlbumListView.defaultProps = {
  onViewAlbum: undefined,
  onEditAlbum: undefined,
  onDeleteAlbum: undefined,
};
