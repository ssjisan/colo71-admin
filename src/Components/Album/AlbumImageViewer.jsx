import { useCallback, useEffect, useState } from "react";
import { Box, Dialog, IconButton, Typography } from "@mui/material";
import PropTypes from "prop-types";
import API from "../../api/axios";
import Icon from "../Icon";

export default function AlbumImageViewer({ open, album, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const images = Array.isArray(album?.images) ? album.images : [];
  const totalImages = images.length;

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setImageError(false);
    }
  }, [open, album?._id]);

  const getImageUrl = (image) => {
    const imagePath =
      typeof image === "string"
        ? image
        : image?.url || image?.path || image?.filename || "";

    if (!imagePath) return "";

    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    const baseURL = (API.defaults.baseURL || "").replace(/\/+$/, "");
    const cleanPath = imagePath.replace(/^\/+/, "");

    if (cleanPath.startsWith("file-storage/")) {
      return `${baseURL}/${cleanPath}`;
    }

    if (cleanPath.startsWith("gallery/")) {
      return `${baseURL}/file-storage/${cleanPath}`;
    }

    return `${baseURL}/file-storage/gallery/${album?.slug || ""}/${cleanPath}`;
  };

  const goPrevious = useCallback(() => {
    setImageError(false);
    setCurrentIndex((index) => Math.max(0, index - 1));
  }, []);

  const goNext = useCallback(() => {
    setImageError(false);
    setCurrentIndex((index) => Math.min(totalImages - 1, index + 1));
  }, [totalImages]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") goPrevious();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, goPrevious, goNext, onClose]);

  const currentImage = images[currentIndex];
  const imageUrl = currentImage ? getImageUrl(currentImage) : "";

  const navigationButtonSx = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 2,
    width: { xs: 42, sm: 50 },
    height: { xs: 42, sm: 50 },
    p: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFFFFF",
    backgroundColor: "#242424",
    border: "1px solid #555555",
    borderRadius: "50%",
    "&:hover": {
      backgroundColor: "#3A3A3A",
    },
    "&.Mui-disabled": {
      color: "#666666",
      backgroundColor: "#151515",
      borderColor: "#333333",
    },
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      sx={{
        zIndex: 1500,
        "& .MuiDialog-paper": {
          backgroundColor: "rgba(0, 0, 0, 0.64)",
          backgroundImage: "none",
          boxShadow: "none",
        },
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.64)",
        },
      }}
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.64)",
            backgroundImage: "none",
            boxShadow: "none",
          },
        },
        backdrop: {
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.64)",
          },
        },
      }}
    >
      {" "}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100dvh",
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Album title */}
        <Box
          sx={{
            position: "absolute",
            top: { xs: 16, sm: 24 },
            left: { xs: 16, sm: 28 },
            right: { xs: 68, sm: 90 },
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          <Typography
            sx={{
              color: "#FFFFFF",
              fontSize: { xs: 14, sm: 17 },
              fontWeight: 600,
              lineHeight: 1.4,
              overflowWrap: "anywhere",
            }}
          >
            {album?.name || album?.title || "Gallery"}
          </Typography>
        </Box>

        {/* Close button */}
        <IconButton
          onClick={onClose}
          aria-label="Close image viewer"
          sx={{
            position: "absolute",
            top: { xs: 10, sm: 16 },
            right: { xs: 10, sm: 20 },
            zIndex: 4,
            width: { xs: 42, sm: 48 },
            height: { xs: 42, sm: 48 },
            p: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            backgroundColor: "#242424",
            border: "1px solid #555555",
            borderRadius: "50%",
            "&:hover": {
              backgroundColor: "#3A3A3A",
            },
          }}
        >
          <Icon name="cross" size="20px" color="#fff" />
        </IconButton>

        {totalImages === 0 ? (
          <Typography
            sx={{
              px: 3,
              color: "#FFFFFF",
              textAlign: "center",
              fontSize: 16,
            }}
          >
            This album has no images.
          </Typography>
        ) : (
          <>
            {/* Previous */}
            <IconButton
              onClick={goPrevious}
              disabled={currentIndex === 0}
              aria-label="Previous image"
              sx={{
                ...navigationButtonSx,
                left: { xs: 10, sm: 24, md: 32 },
              }}
            >
              <Icon name="arrowleft" size="20px" color="#fff" />
            </IconButton>

            {/* Image preserves its original aspect ratio */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                px: { xs: "60px", sm: "100px", md: "120px" },
                pt: { xs: "76px", sm: "90px" },
                pb: { xs: "82px", sm: "90px" },
              }}
            >
              {imageUrl && !imageError ? (
                <Box
                  key={imageUrl}
                  component="img"
                  src={imageUrl}
                  alt={`Image ${currentIndex + 1} of ${totalImages}`}
                  draggable={false}
                  onError={() => setImageError(true)}
                  sx={{
                    display: "block",
                    width: "auto",
                    height: "auto",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    userSelect: "none",
                  }}
                />
              ) : (
                <Typography
                  sx={{
                    color: "#FFFFFF",
                    fontSize: 15,
                    textAlign: "center",
                  }}
                >
                  Unable to load this image.
                </Typography>
              )}
            </Box>

            {/* Next */}
            <IconButton
              onClick={goNext}
              disabled={currentIndex === totalImages - 1}
              aria-label="Next image"
              sx={{
                ...navigationButtonSx,
                right: { xs: 10, sm: 24, md: 32 },
              }}
            >
              <Icon name="arrowright" size="20px" color="#fff" />
            </IconButton>

            {/* Image counter */}
            <Box
              sx={{
                position: "absolute",
                bottom: { xs: 18, sm: 24 },
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                zIndex: 3,
                pointerEvents: "none",
              }}
            >
              <Typography
                sx={{
                  minWidth: 64,
                  px: 2,
                  py: 1,
                  color: "#FFFFFF",
                  backgroundColor: "#242424",
                  border: "1px solid #555555",
                  borderRadius: "24px",
                  fontSize: { xs: 13, sm: 14 },
                  fontWeight: 600,
                  lineHeight: 1.4,
                  textAlign: "center",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {currentIndex + 1} / {totalImages}
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Dialog>
  );
}

AlbumImageViewer.propTypes = {
  open: PropTypes.bool.isRequired,
  album: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    title: PropTypes.string,
    slug: PropTypes.string,
    images: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          url: PropTypes.string,
          path: PropTypes.string,
          filename: PropTypes.string,
        }),
      ]),
    ),
  }),
  onClose: PropTypes.func.isRequired,
};

AlbumImageViewer.defaultProps = {
  album: null,
};
