import { useRef, useState } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import Icon from "../../Icon";
import PropTypes from "prop-types";

const DEFAULT_ACCEPTED_FORMATS =
  "image/jpeg,image/png,image/webp,image/gif,image/avif";

export default function AlbumDetailsThumbnail({
  name,
  setName,
  thumbnailInputRef,
  handleThumbnailChange,
  thumbnailPreview,
  ACCEPTED_FORMATS = DEFAULT_ACCEPTED_FORMATS,
  thumbnailFile,
  existingThumbnail,
  handleUndoThumbnail,
  busy,
  formatFileSize,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const openFilePicker = () => {
    if (busy || !thumbnailInputRef.current) return;

    thumbnailInputRef.current.value = "";
    thumbnailInputRef.current.click();
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (busy) return;

    dragCounter.current += 1;

    if (event.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounter.current = Math.max(0, dragCounter.current - 1);

    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!busy) {
      event.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounter.current = 0;
    setIsDragging(false);

    if (busy || !thumbnailInputRef.current) return;

    const file = Array.from(event.dataTransfer.files || []).find((item) =>
      item.type.startsWith("image/"),
    );

    if (!file) return;

    const transfer = new DataTransfer();
    transfer.items.add(file);

    const input = thumbnailInputRef.current;
    input.value = "";
    input.files = transfer.files;

    // Keep the existing edit form validation and preview logic.
    handleThumbnailChange({ target: input });
  };

  const thumbnailName =
    thumbnailFile?.file?.name ||
    existingThumbnail?.originalName ||
    existingThumbnail?.filename ||
    "Current album thumbnail";

  const thumbnailSize = thumbnailFile
    ? formatFileSize(thumbnailFile.file.size)
    : existingThumbnail?.size
      ? formatFileSize(existingThumbnail.size)
      : "Current thumbnail";

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
      }}
    >
      <Stack spacing={3}>
        {/* Album details */}
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Album details
          </Typography>

          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Add a name and choose a cover image for your album.
          </Typography>
        </Box>
        <Box>
          <Typography
            component="label"
            htmlFor="album-name"
            variant="subtitle2"
            fontWeight={600}
            mb={1}
            display="block"
          >
            Album name
          </Typography>
          <Box
            component="input"
            id="album-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Facility Gallery 2026"
            maxLength={150}
            required
            disabled={busy}
            sx={{
              width: "100%",
              boxSizing: "border-box",
              height: 48,
              px: 1.5,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "background.paper",
              color: "text.primary",
              font: "inherit",
              outline: "none",
              "&:focus": {
                borderColor: "primary.main",
                boxShadow: (theme) =>
                  `0 0 0 3px ${theme.palette.primary.main}20`,
              },
            }}
          />
        </Box>

        {/* Album thumbnail */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Album thumbnail
          </Typography>

          <input
            ref={thumbnailInputRef}
            type="file"
            accept={ACCEPTED_FORMATS}
            hidden
            onChange={handleThumbnailChange}
            disabled={busy}
          />

          {thumbnailPreview ? (
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              {thumbnailFile?.preview || thumbnailPreview ? (
                <Box
                  component="img"
                  src={thumbnailPreview}
                  alt={thumbnailName}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: 190,
                    objectFit: "cover",
                    bgcolor: "action.hover",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    height: 190,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "action.hover",
                  }}
                >
                  <Icon name="image" size={40} />
                </Box>
              )}

              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={1.5}
                sx={{ p: 1.5 }}
              >
                <Box flex={1} minWidth={0}>
                  <Typography fontWeight={600} noWrap>
                    {thumbnailName}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {thumbnailSize}
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={busy}
                    onClick={openFilePicker}
                  >
                    Change
                  </Button>

                  {thumbnailFile && (
                    <Button
                      size="small"
                      color="error"
                      disabled={busy}
                      onClick={handleUndoThumbnail}
                    >
                      Undo replacement
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          ) : (
            <Box
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFilePicker}
              role="button"
              tabIndex={busy ? -1 : 0}
              aria-label="Choose or drop an album thumbnail"
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openFilePicker();
                }
              }}
              sx={{
                minHeight: 290,
                p: 2,
                border: "1px dashed",
                borderColor: isDragging ? "primary.main" : "divider",
                borderRadius: 2,
                bgcolor: isDragging ? "action.selected" : "#F7F9FA",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                cursor: busy ? "not-allowed" : "pointer",
                transition: "all 180ms ease",
                "&:hover": {
                  borderColor: busy ? "divider" : "primary.main",
                },
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                  outlineOffset: 2,
                },
              }}
            >
              <Box
                component="img"
                src="/imagePlaceholder.png"
                alt=""
                sx={{
                  width: "100%",
                  maxWidth: 190,
                  height: 125,
                  objectFit: "contain",
                  mb: 2,
                }}
              />

              <Typography variant="h6" fontWeight={600}>
                Drop thumbnail here
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, lineHeight: 1.8 }}
              >
                Drag an image here, or{" "}
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

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1.5 }}
              >
                JPG, PNG, WEBP, GIF or AVIF · Maximum 2 MB
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

AlbumDetailsThumbnail.propTypes = {
  name: PropTypes.string.isRequired,
  setName: PropTypes.func.isRequired,
  thumbnailInputRef: PropTypes.shape({
    current: PropTypes.any,
  }).isRequired,
  handleThumbnailChange: PropTypes.func.isRequired,
  thumbnailPreview: PropTypes.string,
  ACCEPTED_FORMATS: PropTypes.string,
  thumbnailFile: PropTypes.shape({
    file: PropTypes.object,
    preview: PropTypes.string,
  }),
  existingThumbnail: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      originalName: PropTypes.string,
      filename: PropTypes.string,
      size: PropTypes.number,
    }),
  ]),
  handleUndoThumbnail: PropTypes.func.isRequired,
  busy: PropTypes.bool,
  formatFileSize: PropTypes.func.isRequired,
};

AlbumDetailsThumbnail.defaultProps = {
  thumbnailPreview: "",
  ACCEPTED_FORMATS: DEFAULT_ACCEPTED_FORMATS,
  thumbnailFile: null,
  existingThumbnail: null,
  busy: false,
};
