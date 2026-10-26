import { useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Icon from "../../Icon";
import PropTypes from "prop-types";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,image/avif";

export default function AlbumGalleryImages({
  images = [],
  imagesInputRef,
  handleImagesChange,
  uploadProgress = 0,
  uploading = false,
  busy = false,
  removingId = null,
  draggedId = null,
  setDraggedId,
  moveImage,
  removeImage,
  formatFileSize,
  maxImages = 50,
}) {
  const [isDragging, setIsDragging] = useState(false);

  const remainingSlots = Math.max(0, maxImages - images.length);
  const canAddImages = !busy && remainingSlots > 0;

  const openFilePicker = () => {
    if (!canAddImages || !imagesInputRef.current) return;

    imagesInputRef.current.value = "";
    imagesInputRef.current.click();
  };

  const handleDragOver = (event) => {
    event.preventDefault();

    if (canAddImages) {
      event.dataTransfer.dropEffect = "copy";
      setIsDragging(true);
    } else {
      event.dataTransfer.dropEffect = "none";
    }
  };

  const handleDropFiles = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (!canAddImages || !imagesInputRef.current) return;

    const droppedFiles = Array.from(event.dataTransfer.files || []);
    if (!droppedFiles.length) return;

    const filesToAdd = droppedFiles.slice(0, remainingSlots);

    if (droppedFiles.length > remainingSlots) {
      // The existing handler remains responsible for validation.
      // Only files that fit within the image limit are passed to it.
    }

    const transfer = new DataTransfer();
    filesToAdd.forEach((file) => transfer.items.add(file));

    const input = imagesInputRef.current;
    input.value = "";
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        minWidth: 0,
      }}
    >
      <Stack spacing={2}>
        {/* Gallery header */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Gallery images
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Choose multiple images and drag rows to change their order.
            </Typography>
          </Box>

          <Chip
            label={`${images.length} / ${maxImages} images`}
            color={images.length === maxImages ? "warning" : "default"}
          />
        </Box>

        {/* File input */}
        <input
          ref={imagesInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          hidden
          onChange={handleImagesChange}
          disabled={!canAddImages}
        />

        {/* Same illustrated upload area as Add Album */}
        <Box
          onDragEnter={(event) => {
            event.preventDefault();

            if (canAddImages) setIsDragging(true);
          }}
          onDragOver={handleDragOver}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsDragging(false);
            }
          }}
          onDrop={handleDropFiles}
          onClick={openFilePicker}
          role="button"
          tabIndex={canAddImages ? 0 : -1}
          aria-label="Choose or drop gallery images"
          onKeyDown={(event) => {
            if (canAddImages && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              openFilePicker();
            }
          }}
          sx={{
            minHeight: 290,
            p: { xs: 2, md: 3 },
            border: "1px dashed",
            borderColor: isDragging ? "primary.main" : "divider",
            borderRadius: 2,
            bgcolor: isDragging ? "action.selected" : "#F7F9FA",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            cursor: canAddImages ? "pointer" : "not-allowed",
            transition: "all 180ms ease",
            outline: "none",
            "&:hover": {
              borderColor: canAddImages ? "primary.main" : "divider",
            },
            "&:focus-visible": {
              borderColor: "primary.main",
              boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main}20`,
            },
          }}
        >
          <Box
            component="img"
            src="/imagePlaceholder.png"
            alt=""
            draggable={false}
            sx={{
              width: "100%",
              maxWidth: 190,
              height: 125,
              objectFit: "contain",
              mb: 2,
              opacity: canAddImages ? 1 : 0.55,
              pointerEvents: "none",
            }}
          />

          <Typography variant="h6" fontWeight={600}>
            {isDragging ? "Drop your images here" : "Drop or select files"}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, lineHeight: 1.8 }}
          >
            Drag images here, or{" "}
            <Box
              component="span"
              sx={{
                color: "primary.main",
                textDecoration: "underline",
                fontWeight: 600,
              }}
            >
              browse
            </Box>{" "}
            your device.
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5 }}>
            JPG, PNG, WEBP, GIF or AVIF · Maximum 2 MB per image
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {remainingSlots} image slots remaining · Up to {maxImages} images
          </Typography>

          {!canAddImages && remainingSlots === 0 && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 1 }}>
              Maximum image limit reached.
            </Typography>
          )}
        </Box>

        {/* Upload progress */}
        {uploading && (
          <Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">Uploading files...</Typography>
              <Typography variant="body2">{uploadProgress}%</Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{ borderRadius: 5, height: 6 }}
            />
          </Box>
        )}

        {/* Existing and newly selected images */}
        {images.length === 0 ? (
          <Typography color="text.secondary">
            Add at least one image before saving this album.
          </Typography>
        ) : (
          <Stack spacing={1}>
            <Typography fontWeight={600}>
              Gallery photos ({images.length})
            </Typography>

            {images.map((item, index) => {
              const imageUrl =
                item.type === "new" ? item.preview : item.preview || "";

              const label =
                item.type === "new"
                  ? item.file.name
                  : item.image?.originalName ||
                    item.filename ||
                    `Image ${index + 1}`;

              const size =
                item.type === "new" ? item.file.size : item.image?.size;

              return (
                <Paper
                  key={item.key}
                  variant="outlined"
                  draggable={!busy}
                  onDragStart={(event) => {
                    setDraggedId(item.key);

                    if (event.dataTransfer) {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", item.key);
                    }
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();

                    if (event.dataTransfer) {
                      event.dataTransfer.dropEffect = "move";
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    const sourceId =
                      draggedId || event.dataTransfer.getData("text/plain");

                    if (sourceId && sourceId !== item.key) {
                      moveImage(sourceId, item.key);
                    }

                    setDraggedId(null);
                  }}
                  onDragEnd={() => setDraggedId(null)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.25,
                    borderRadius: 2,
                    minWidth: 0,
                    cursor: busy ? "default" : "grab",
                    opacity: draggedId === item.key ? 0.45 : 1,
                    transition: "background-color 150ms ease",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  {/* Image preview */}
                  <Box
                    sx={{
                      width: 76,
                      height: 68,
                      flexShrink: 0,
                      overflow: "hidden",
                      borderRadius: 1.5,
                      bgcolor: "action.hover",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {imageUrl ? (
                      <Box
                        component="img"
                        src={imageUrl}
                        alt={label}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Icon name="camera" size={26} />
                    )}
                  </Box>

                  {/* File details */}
                  <Box flex={1} minWidth={0}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      flexWrap="wrap"
                    >
                      <Chip
                        size="small"
                        label={`#${index + 1}`}
                        variant="outlined"
                      />

                      <Typography
                        variant="caption"
                        color={
                          item.type === "new" ? "info.main" : "success.main"
                        }
                      >
                        {item.type === "new" ? "New image" : "Existing"}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="body2"
                      fontWeight={600}
                      noWrap
                      title={label}
                      mt={0.5}
                    >
                      {label}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {size ? formatFileSize(size) : "File size unavailable"}
                    </Typography>
                  </Box>

                  {/* Drag handle */}
                  <IconButton
                    size="small"
                    aria-label={`Drag ${label} to reorder`}
                    disabled={busy}
                    sx={{ cursor: "grab", flexShrink: 0 }}
                  >
                    <Icon name="drag" size={18} />
                  </IconButton>

                  {/* Remove image */}
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Remove ${label}`}
                    onClick={() => removeImage(item)}
                    disabled={busy}
                    sx={{ flexShrink: 0 }}
                  >
                    {removingId === item.key ? (
                      <CircularProgress size={18} />
                    ) : (
                      <Icon name="delete" size={18} color="red" />
                    )}
                  </IconButton>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

AlbumGalleryImages.propTypes = {
  images: PropTypes.array.isRequired,
  imagesInputRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  handleImagesChange: PropTypes.func.isRequired,
  uploadProgress: PropTypes.number.isRequired,
  uploading: PropTypes.bool.isRequired,
  busy: PropTypes.bool.isRequired,
  removingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  draggedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setDraggedId: PropTypes.func.isRequired,
  moveImage: PropTypes.func.isRequired,
  removeImage: PropTypes.func.isRequired,
  formatFileSize: PropTypes.func.isRequired,
  maxImages: PropTypes.number,
};

AlbumGalleryImages.defaultProps = {
  maxImages: 50,
  removingId: null,
  draggedId: null,
};
