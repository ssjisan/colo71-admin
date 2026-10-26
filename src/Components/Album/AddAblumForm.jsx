import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import Icon from "../Icon";
import API from "../../api/axios";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_IMAGES = 50;

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const ACCEPTED_FORMATS = "image/jpeg,image/png,image/webp,image/gif,image/avif";

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

    if (thumbnail) {
      toast.error("A thumbnail is already uploaded.");
      return;
    }

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
        maxWidth: 1100,
        mx: "auto",
        p: { xs: 2, md: 4 },
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Create Album
          </Typography>
          <Typography color="text.secondary" mt={0.5}>
            Upload a cover image and organize your gallery photos.
          </Typography>
        </Box>

        {/* Album details */}
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={600}>
              Album details
            </Typography>

            <TextField
              label="Album name"
              placeholder="e.g. Summer Facility"
              value={albumName}
              onChange={(event) => setAlbumName(event.target.value)}
              inputProps={{ maxLength: 150 }}
              required
              fullWidth
            />
          </Stack>
        </Paper>

        {/* Thumbnail */}
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={600}>
              Album thumbnail
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Choose one cover image. Maximum size: 2 MB.
            </Typography>

            <input
              ref={thumbnailInputRef}
              type="file"
              accept={ACCEPTED_FORMATS}
              hidden
              onChange={handleThumbnailChange}
            />

            {thumbnail ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 1.5,
                }}
              >
                {thumbnail.preview ? (
                  <Box
                    component="img"
                    src={thumbnail.preview}
                    alt={thumbnail.originalName}
                    sx={{
                      width: 100,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 1,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 100,
                      height: 80,
                      bgcolor: "action.hover",
                      borderRadius: 1,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="camera" size={28} />
                  </Box>
                )}

                <Box flex={1} minWidth={0}>
                  <Typography fontWeight={600} noWrap>
                    {thumbnail.originalName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(thumbnail.size)}
                  </Typography>
                  <Chip
                    size="small"
                    color="success"
                    label="Uploaded"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
            ) : (
              <Button
                variant="outlined"
                startIcon={<Icon name="upload" />}
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={busy}
                sx={{ alignSelf: "flex-start" }}
              >
                Choose thumbnail
              </Button>
            )}
          </Stack>
        </Paper>

        {/* Gallery images */}
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Stack spacing={2}>
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
                label={`${images.length} / ${MAX_IMAGES} images`}
                color={images.length === MAX_IMAGES ? "warning" : "default"}
              />
            </Box>

            <input
              ref={imagesInputRef}
              type="file"
              accept={ACCEPTED_FORMATS}
              multiple
              hidden
              onChange={handleImagesChange}
            />

            <Box
              onClick={() => {
                if (!busy && images.length < MAX_IMAGES) {
                  imagesInputRef.current?.click();
                }
              }}
              sx={{
                border: "2px dashed",
                borderColor: "divider",
                borderRadius: 3,
                p: { xs: 3, md: 4 },
                textAlign: "center",
                cursor:
                  busy || images.length >= MAX_IMAGES
                    ? "not-allowed"
                    : "pointer",
                bgcolor: "action.hover",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <Icon name="upload" size={28} />

              <Typography fontWeight={600} mt={1}>
                Click to choose images
              </Typography>

              <Typography variant="body2" color="text.secondary" mt={0.5}>
                JPG, PNG, WEBP, GIF or AVIF · Maximum 2 MB per image
              </Typography>

              <Button
                variant="contained"
                sx={{ mt: 2 }}
                disabled={busy || images.length >= MAX_IMAGES}
                onClick={(event) => {
                  event.stopPropagation();
                  imagesInputRef.current?.click();
                }}
              >
                Choose photos
              </Button>
            </Box>

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

            {images.length > 0 && (
              <Stack spacing={1}>
                <Typography fontWeight={600}>
                  Uploaded photos ({images.length})
                </Typography>

                {images.map((image, index) => (
                  <Paper
                    key={image.id}
                    variant="outlined"
                    draggable={!busy}
                    onDragStart={() => setDraggedId(image.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      moveImage(draggedId, image.id);
                      setDraggedId(null);
                    }}
                    onDragEnd={() => setDraggedId(null)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.25,
                      borderRadius: 2,
                      cursor: busy ? "default" : "grab",
                      opacity: draggedId === image.id ? 0.45 : 1,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
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
                      {image.preview ? (
                        <Box
                          component="img"
                          src={image.preview}
                          alt={image.originalName}
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

                    <Box flex={1} minWidth={0}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip
                          size="small"
                          label={`#${index + 1}`}
                          variant="outlined"
                        />
                        <Typography variant="caption" color="success.main">
                          Uploaded
                        </Typography>
                      </Stack>

                      <Typography
                        variant="body2"
                        fontWeight={600}
                        noWrap
                        title={image.originalName}
                        mt={0.5}
                      >
                        {image.originalName}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(image.size)}
                      </Typography>
                    </Box>

                    <IconButton
                      size="small"
                      aria-label={`Drag ${image.originalName} to reorder`}
                      disabled={busy}
                      sx={{ cursor: "grab" }}
                    >
                      <Icon name="drag" size={18} />
                    </IconButton>

                    <IconButton
                      size="small"
                      color="error"
                      aria-label={`Remove ${image.originalName}`}
                      onClick={() => removeImage(image)}
                      disabled={busy}
                    >
                      {removingId === image.id ? (
                        <CircularProgress size={18} />
                      ) : (
                        <Icon name="delete" size={18} />
                      )}
                    </IconButton>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>

        {/* Actions */}
        <Box display="flex" justifyContent="flex-end" gap={1.5} flexWrap="wrap">
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
            size="large"
            disabled={busy}
            startIcon={
              submitting ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            {submitting ? "Creating album..." : "Submit album"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
