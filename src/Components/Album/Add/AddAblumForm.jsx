import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import API from "../../../api/axios";
import AlbumDetailsThumbnail from "./AlbumDetailsThumbnail";
import AlbumGalleryImages from "./AlbumGalleryImages";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_IMAGES = 50;

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

export default function AddAblumForm() {
  const thumbnailInputRef = useRef(null);
  const imagesInputRef = useRef(null);
  const previewUrlsRef = useRef(new Set());

  const [albumName, setAlbumName] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [images, setImages] = useState([]);
  const [sessionId, setSessionId] = useState("");

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);

  const busy = uploading || submitting || Boolean(removingId);

  const createPreview = (file) => {
    const url = URL.createObjectURL(file);
    previewUrlsRef.current.add(url);
    return url;
  };

  const revokePreview = (url) => {
    if (!url || !previewUrlsRef.current.has(url)) return;

    URL.revokeObjectURL(url);
    previewUrlsRef.current.delete(url);
  };

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, []);

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `${file.name}: unsupported image format.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: exceeds the 2 MB limit.`;
    }

    if (file.size === 0) {
      return `${file.name}: empty files are not allowed.`;
    }

    return "";
  };

  // Upload files immediately and preserve upload progress.
  const uploadBatch = (formData, existingSessionId = "") =>
    API.post("/upload", formData, {
      headers: existingSessionId
        ? { "x-upload-session-id": existingSessionId }
        : {},
      onUploadProgress: (event) => {
        if (event.total) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });

  const uploadFiles = async (imageFiles = [], thumbnailFile = null) => {
    if (busy) return;

    const availableSlots = MAX_IMAGES - images.length;

    if (imageFiles.length > availableSlots) {
      toast.error(`You can add only ${availableSlots} more image(s).`);
      imageFiles = imageFiles.slice(0, availableSlots);
    }

    if (!imageFiles.length && !thumbnailFile) return;

    const pendingPreviews = new Map();

    imageFiles.forEach((file) => {
      const key = `${file.name}:${file.size}:${file.lastModified}`;

      pendingPreviews.set(key, {
        file,
        preview: createPreview(file),
      });
    });

    const thumbnailPreview = thumbnailFile
      ? createPreview(thumbnailFile)
      : null;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const response = await uploadBatch(formData, sessionId);
      const data = response.data?.data;

      if (!data?.sessionId) {
        throw new Error("The server did not return an upload session ID.");
      }

      setSessionId(data.sessionId);

      if (data.thumbnail) {
        setThumbnail((current) => {
          if (current?.preview && !thumbnailFile) {
            return { ...data.thumbnail, preview: current.preview };
          }

          if (current?.preview && thumbnailFile) {
            revokePreview(current.preview);
          }

          return {
            ...data.thumbnail,
            preview: thumbnailPreview || current?.preview || null,
          };
        });
      }

      if (Array.isArray(data.images)) {
        setImages((current) => {
          const existingByFilename = new Map(
            current.map((image) => [image.filename, image]),
          );

          const pending = [...pendingPreviews.values()];

          return data.images.map((image) => {
            const existing = existingByFilename.get(image.filename);

            if (existing) {
              return {
                ...image,
                id: image.filename,
                preview: existing.preview,
              };
            }

            const matchIndex = pending.findIndex(
              ({ file }) =>
                file.name === image.originalName && file.size === image.size,
            );

            const match =
              matchIndex >= 0 ? pending.splice(matchIndex, 1)[0] : null;

            return {
              ...image,
              id: image.filename,
              preview: match?.preview || null,
            };
          });
        });
      }

      toast.success(
        thumbnailFile
          ? "Thumbnail uploaded successfully."
          : `${imageFiles.length} image(s) uploaded successfully.`,
      );
    } catch (error) {
      pendingPreviews.forEach(({ preview }) => revokePreview(preview));

      if (thumbnailPreview) {
        revokePreview(thumbnailPreview);
      }

      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleThumbnailChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const error = validateFile(file);

    if (error) {
      toast.error(error);
      return;
    }

    // Allow selecting a replacement thumbnail.
    await uploadFiles([], file);
  };

  const handleImagesChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selectedFiles.length) return;

    const validFiles = [];

    selectedFiles.forEach((file) => {
      const error = validateFile(file);

      if (error) {
        toast.error(error);
      } else {
        validFiles.push(file);
      }
    });

    const remainingSlots = MAX_IMAGES - images.length;
    const filesToUpload = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} additional image(s) can be added.`);
    }

    if (filesToUpload.length) {
      await uploadFiles(filesToUpload);
    }
  };

  // Delete the selected file from temporary storage on the server.
  const removeImage = async (image) => {
    if (busy) return;

    if (!sessionId) {
      toast.error("Upload session not found. Please upload the images again.");
      return;
    }

    setRemovingId(image.id);

    try {
      const response = await API.delete("/remove-image", {
        headers: {
          "x-upload-session-id": sessionId,
        },
        data: {
          filename: image.filename,
        },
      });

      setImages((current) =>
        current
          .filter((item) => item.id !== image.id)
          .map((item, index) => ({ ...item, order: index })),
      );

      revokePreview(image.preview);

      toast.success(response.data?.message || "Image removed successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRemovingId(null);
    }
  };

  // Reorder the list by dragging one row over another.
  const moveImage = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    setImages((current) => {
      const reordered = [...current];

      const sourceIndex = reordered.findIndex((image) => image.id === sourceId);
      const targetIndex = reordered.findIndex((image) => image.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0) return current;

      const [movedImage] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, movedImage);

      return reordered.map((image, index) => ({
        ...image,
        order: index,
      }));
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!albumName.trim()) {
      toast.error("Please enter an album name.");
      return;
    }

    if (!sessionId || !thumbnail || !images.length) {
      toast.error("Upload a thumbnail and at least one gallery image first.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await API.post(
        "/create-album",
        {
          name: albumName.trim(),
          order: images.map((image) => image.filename),
        },
        {
          headers: {
            "x-upload-session-id": sessionId,
          },
        },
      );

      toast.success(response.data?.message || "Album created successfully.");

      images.forEach((image) => revokePreview(image.preview));

      if (thumbnail?.preview) {
        revokePreview(thumbnail.preview);
      }

      setAlbumName("");
      setThumbnail(null);
      setImages([]);
      setSessionId("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: "100%",
        maxWidth: 1600,
        mx: "auto",
        p: { xs: 2, md: 3 },
        pb: { xs: 12, md: 11 },
      }}
    >
      <Stack spacing={3}>
        {/* Header stays in AddAblumForm */}
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Create Album
          </Typography>

          <Typography color="text.secondary" mt={0.5}>
            Upload a cover image and organize your gallery photos.
          </Typography>
        </Box>

        {/* Two-column layout: 5/12 + 7/12 */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "minmax(0, 5fr) minmax(0, 7fr)",
            },
            gap: { xs: 2, md: 3 },
            alignItems: "start",
          }}
        >
          {/* Left column: 5 grid columns */}
          <AlbumDetailsThumbnail
            albumName={albumName}
            setAlbumName={setAlbumName}
            thumbnail={thumbnail}
            thumbnailInputRef={thumbnailInputRef}
            handleThumbnailChange={handleThumbnailChange}
            formatFileSize={formatFileSize}
            busy={busy}
          />

          {/* Right column: 7 grid columns */}
          <AlbumGalleryImages
            images={images}
            imagesInputRef={imagesInputRef}
            handleImagesChange={handleImagesChange}
            uploadProgress={uploadProgress}
            uploading={uploading}
            busy={busy}
            removingId={removingId}
            draggedId={draggedId}
            setDraggedId={setDraggedId}
            moveImage={moveImage}
            removeImage={removeImage}
            formatFileSize={formatFileSize}
            maxImages={MAX_IMAGES}
          />
        </Box>
      </Stack>

      {/* Fixed bottom action bar stays in AddAblumForm */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 1.5,
          px: { xs: 2, md: 4 },
          py: 1.5,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => window.history.back()}
          disabled={busy}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={busy}
          startIcon={
            submitting ? <CircularProgress size={18} color="inherit" /> : null
          }
        >
          {submitting ? "Creating album..." : "Submit album"}
        </Button>
      </Box>
    </Box>
  );
}
