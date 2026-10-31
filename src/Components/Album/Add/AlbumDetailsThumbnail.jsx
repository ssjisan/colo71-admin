import { useState } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import Icon from "../../Icon";
import PropTypes from "prop-types";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,image/avif";

export default function AlbumDetailsThumbnail({
  albumName,
  setAlbumName,
  thumbnail,
  thumbnailInputRef,
  handleThumbnailChange,
  formatFileSize,
  busy,
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file || busy || !thumbnailInputRef.current) return;

    // Reuse the existing thumbnail change handler.
    const transfer = new DataTransfer();
    transfer.items.add(file);

    thumbnailInputRef.current.files = transfer.files;
    thumbnailInputRef.current.dispatchEvent(
      new Event("change", { bubbles: true }),
    );
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
      }}
    >
      <Stack spacing={3}>
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
            value={albumName}
            onChange={(event) => setAlbumName(event.target.value)}
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

        <Box>
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Album thumbnail
          </Typography>

          <input
            ref={thumbnailInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            hidden
            onChange={handleThumbnailChange}
          />

          {thumbnail ? (
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              {thumbnail.preview ? (
                <Box
                  component="img"
                  src={thumbnail.preview}
                  alt={thumbnail.originalName}
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
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ p: 1.5 }}
              >
                <Box flex={1} minWidth={0}>
                  <Typography fontWeight={600} noWrap>
                    {thumbnail.originalName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(thumbnail.size)}
                  </Typography>
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  disabled={busy}
                  onClick={() => {
                    if (thumbnailInputRef.current) {
                      thumbnailInputRef.current.value = "";
                      thumbnailInputRef.current.click();
                    }
                  }}
                >
                  Change
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box
              onDragEnter={(event) => {
                event.preventDefault();
                if (!busy) setIsDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setIsDragging(false);
                }
              }}
              onDrop={handleDrop}
              onClick={() => {
                if (!busy) thumbnailInputRef.current?.click();
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
              }}
            >
              <Box
                component="img"
                src="imagePlaceholder.png"
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
  albumName: PropTypes.string.isRequired,
  setAlbumName: PropTypes.func.isRequired,
  thumbnail: PropTypes.shape({
    preview: PropTypes.string,
    originalName: PropTypes.string,
    size: PropTypes.number,
  }),
  thumbnailInputRef: PropTypes.shape({
    current: PropTypes.instanceOf(
      typeof HTMLInputElement !== "undefined" ? HTMLInputElement : Object,
    ),
  }).isRequired,
  handleThumbnailChange: PropTypes.func.isRequired,
  formatFileSize: PropTypes.func.isRequired,
  busy: PropTypes.bool,
};

AlbumDetailsThumbnail.defaultProps = {
  thumbnail: null,
  busy: false,
};
