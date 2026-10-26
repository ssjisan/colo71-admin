import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useParams, useNavigate } from "react-router-dom";

import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import toast from "react-hot-toast";
import API from "../../api/axios";

const MAX_IMAGES = 50;
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const getFilename = (image) =>
  typeof image === "string" ? image : image?.filename || "";

const getImageUrl = (image, album) => {
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

const validateFile = (file) => {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `${file.name}: choose a JPG, PNG, WEBP, GIF, or AVIF image.`;
  }

  if (file.size < 1 || file.size > MAX_FILE_SIZE) {
    return `${file.name}: image size must be 2 MB or less.`;
  }

  return "";
};

const normalizeAlbumResponse = (responseData) =>
  responseData?.data?.album ??
  responseData?.data?.galleryAlbum ??
  responseData?.data;

const makeExistingImages = (images = []) =>
  [...images]
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map((image, index) => ({
      key: `existing-${getFilename(image) || index}`,
      type: "existing",
      filename: getFilename(image),
      image,
    }));

export default function AlbumEditForm({
  album: initialAlbum,
  onCancel,
  onSaved,
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const thumbnailInputRef = useRef(null);
  const imagesInputRef = useRef(null);
  const objectUrlsRef = useRef(new Set());

  const [album, setAlbum] = useState(initialAlbum || null);
  const [loadingAlbum, setLoadingAlbum] = useState(true);
  const [albumError, setAlbumError] = useState("");

  const [name, setName] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [existingThumbnail, setExistingThumbnail] = useState(null);
  const [orderedImages, setOrderedImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const allImages = useMemo(() => orderedImages, [orderedImages]);

  const createPreviewUrl = (file) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);
    return url;
  };

  const revokePreviewUrl = (url) => {
    if (url && objectUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current.delete(url);
    }
  };

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, []);

  // Fetch the album directly so AlbumEdit.jsx does not need to change.
  useEffect(() => {
    let active = true;

    const fetchAlbum = async () => {
      if (!id && !initialAlbum?._id) {
        setAlbumError("Album ID is missing from the URL.");
        setLoadingAlbum(false);
        return;
      }

      try {
        setLoadingAlbum(true);
        setAlbumError("");

        let fetchedAlbum = initialAlbum;

        if (!fetchedAlbum?._id || fetchedAlbum._id !== id) {
          const response = await API.get(`/get-album/${id}`);
          fetchedAlbum = normalizeAlbumResponse(response.data);
        }

        if (!fetchedAlbum?._id) {
          throw new Error("Album details were not returned by the server.");
        }

        if (active) setAlbum(fetchedAlbum);
      } catch (error) {
        if (active) {
          const message =
            error.response?.data?.message ||
            error.message ||
            "Failed to load album.";

          setAlbumError(message);
          toast.error(message);
        }
      } finally {
        if (active) setLoadingAlbum(false);
      }
    };

    fetchAlbum();

    return () => {
      active = false;
    };
  }, [id, initialAlbum]);

  // Initialize and refresh the form when the fetched album changes.
  useEffect(() => {
    if (!album) return;

    setName(album.name || "");
    setExistingThumbnail(album.thumbnail || null);
    setThumbnailFile(null);
    setOrderedImages(makeExistingImages(album.images || []));
  }, [album]);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  const handleThumbnailChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const error = validateFile(file);

    if (error) {
      toast.error(error);
      return;
    }

    if (thumbnailFile?.preview) {
      revokePreviewUrl(thumbnailFile.preview);
    }

    setThumbnailFile({
      file,
      preview: createPreviewUrl(file),
    });
  };

  const handleImagesChange = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    const availableSlots = MAX_IMAGES - orderedImages.length;

    if (availableSlots <= 0) {
      toast.error(`An album cannot contain more than ${MAX_IMAGES} images.`);
      return;
    }

    const acceptedFiles = [];

    for (const file of files) {
      const error = validateFile(file);

      if (error) {
        toast.error(error);
        continue;
      }

      acceptedFiles.push(file);
    }

    if (acceptedFiles.length > availableSlots) {
      toast.error(`You can add only ${availableSlots} more image(s).`);
    }

    const additions = acceptedFiles.slice(0, availableSlots).map((file) => ({
      key: `new-${crypto.randomUUID()}`,
      type: "new",
      file,
      preview: createPreviewUrl(file),
    }));

    setOrderedImages((current) => [...current, ...additions]);
  };

  const moveImage = (index, direction) => {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= orderedImages.length) return;

    setOrderedImages((current) => {
      const reordered = [...current];

      [reordered[index], reordered[targetIndex]] = [
        reordered[targetIndex],
        reordered[index],
      ];

      return reordered;
    });
  };

  const removeImage = (item) => {
    if (item.type === "new") {
      revokePreviewUrl(item.preview);
    }

    setOrderedImages((current) =>
      current.filter((image) => image.key !== item.key),
    );
  };

  const handleUndoThumbnail = () => {
    if (thumbnailFile?.preview) {
      revokePreviewUrl(thumbnailFile.preview);
    }

    setThumbnailFile(null);
  };

  const handleSave = async () => {
    if (!album?._id) {
      toast.error("Album ID is missing.");
      return;
    }

    if (!name.trim()) {
      toast.error("Album title is required.");
      return;
    }

    if (name.trim().length > 150) {
      toast.error("Album title cannot exceed 150 characters.");
      return;
    }

    if (!existingThumbnail && !thumbnailFile) {
      toast.error("Please select an album thumbnail.");
      return;
    }

    if (orderedImages.length < 1 || orderedImages.length > MAX_IMAGES) {
      toast.error(`An album must contain 1 to ${MAX_IMAGES} images.`);
      return;
    }

    setSaving(true);

    try {
      let sessionId = null;
      let uploadedImages = [];

      const newImageItems = orderedImages.filter((item) => item.type === "new");

      if (newImageItems.length || thumbnailFile) {
        const sessionResponse = await API.post("/upload-session");

        sessionId = sessionResponse.data?.data?.sessionId;

        if (!sessionId) {
          throw new Error("Could not create an upload session.");
        }

        const formData = new FormData();

        if (thumbnailFile) {
          formData.append("thumbnail", thumbnailFile.file);
        }

        newImageItems.forEach((item) => {
          formData.append("images", item.file);
        });

        const uploadResponse = await API.post(
          "/upload-session/files",
          formData,
          {
            headers: {
              "x-upload-session-id": sessionId,
            },
          },
        );

        const uploadData = uploadResponse.data?.data;
        uploadedImages = uploadData?.images || [];

        if (uploadedImages.length !== newImageItems.length) {
          throw new Error("Uploaded image count does not match selection.");
        }
      }

      let newImageIndex = 0;

      // Keep the exact order of existing and newly uploaded images.
      const imageOrder = orderedImages.map((item) => {
        if (item.type === "existing") {
          return item.filename;
        }

        const uploaded = uploadedImages[newImageIndex++];

        if (!uploaded?.filename) {
          throw new Error("Could not identify an uploaded image.");
        }

        return uploaded.filename;
      });

      const retainedExistingFilenames = new Set(
        orderedImages
          .filter((item) => item.type === "existing")
          .map((item) => item.filename),
      );

      const removeImages = (album.images || [])
        .map(getFilename)
        .filter(
          (filename) => filename && !retainedExistingFilenames.has(filename),
        );

      const payload = {
        name: name.trim(),
        removeImages,
        imageOrder,
      };

      if (sessionId) {
        payload.sessionId = sessionId;
      }

      await API.put(`/edit-album/${album._id}`, payload);

      toast.success("Album updated successfully.");

      if (onSaved) {
        onSaved();
      } else {
        navigate(-1);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update album.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingAlbum) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (albumError || !album) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          {albumError || "Album not found."}
        </Typography>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={handleCancel}>
          Go Back
        </Button>
      </Box>
    );
  }

  const thumbnailPreview = thumbnailFile?.preview
    ? thumbnailFile.preview
    : getImageUrl(existingThumbnail, album);

  return (
    <Box sx={{ width: "100%", maxWidth: 1100, mx: "auto", pb: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Edit Album
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Update the title, thumbnail, images, and image sequence.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Album Details
          </Typography>

          <TextField
            fullWidth
            label="Album Title"
            value={name}
            onChange={(event) => setName(event.target.value)}
            inputProps={{ maxLength: 150 }}
            helperText={`${name.length}/150 characters`}
          />

          <Divider sx={{ my: 3 }} />

          <Typography fontWeight={600} sx={{ mb: 1 }}>
            Album Thumbnail
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            {thumbnailPreview && (
              <Box
                component="img"
                src={thumbnailPreview}
                alt="Album thumbnail preview"
                sx={{
                  width: { xs: "100%", sm: 220 },
                  height: 140,
                  objectFit: "contain",
                  borderRadius: 1,
                  bgcolor: "action.hover",
                }}
              />
            )}

            <Box>
              <Button
                variant="outlined"
                onClick={() => thumbnailInputRef.current?.click()}
              >
                Replace Thumbnail
              </Button>

              <input
                ref={thumbnailInputRef}
                hidden
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleThumbnailChange}
              />

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Maximum file size: 2 MB.
              </Typography>

              {thumbnailFile && (
                <Button
                  size="small"
                  color="error"
                  onClick={handleUndoThumbnail}
                >
                  Undo Thumbnail Replacement
                </Button>
              )}
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Album Images ({allImages.length}/{MAX_IMAGES})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reorder images with the arrows. Removed images will be deleted
                when you save.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              onClick={() => imagesInputRef.current?.click()}
              disabled={allImages.length >= MAX_IMAGES || saving}
            >
              Add Images
            </Button>

            <input
              ref={imagesInputRef}
              hidden
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              multiple
              onChange={handleImagesChange}
            />
          </Stack>

          {allImages.length === 0 ? (
            <Typography color="text.secondary">
              Add at least one image before saving this album.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {allImages.map((item, index) => {
                const imageUrl =
                  item.type === "new"
                    ? item.preview
                    : getImageUrl(item.image, album);

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
                    sx={{
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Avatar
                      variant="rounded"
                      src={imageUrl}
                      alt={label}
                      sx={{
                        width: { xs: 56, sm: 76 },
                        height: { xs: 56, sm: 76 },
                        flexShrink: 0,
                        bgcolor: "action.hover",
                      }}
                    />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        fontWeight={600}
                        variant="body2"
                        sx={{
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                        }}
                      >
                        {index + 1}. {label}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {size ? `${(size / 1024).toFixed(1)} KB` : ""}
                        {item.type === "new" ? " · New image" : " · Existing"}
                      </Typography>
                    </Box>

                    <Stack spacing={0.5}>
                      <IconButton
                        size="small"
                        aria-label="Move image up"
                        disabled={index === 0 || saving}
                        onClick={() => moveImage(index, -1)}
                      >
                        ↑
                      </IconButton>

                      <IconButton
                        size="small"
                        aria-label="Move image down"
                        disabled={index === allImages.length - 1 || saving}
                        onClick={() => moveImage(index, 1)}
                      >
                        ↓
                      </IconButton>
                    </Stack>

                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeImage(item)}
                      disabled={saving}
                    >
                      Remove
                    </Button>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Paper>

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

AlbumEditForm.propTypes = {
  album: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    slug: PropTypes.string,
    thumbnail: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        filename: PropTypes.string,
        path: PropTypes.string,
        url: PropTypes.string,
      }),
    ]),
    images: PropTypes.array,
  }),
  onCancel: PropTypes.func,
  onSaved: PropTypes.func,
};
