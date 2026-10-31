import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useParams, useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import toast from "react-hot-toast";

import Icon from "../../Icon";
import API from "../../../api/axios";

import AlbumDetailsThumbnail from "./AlbumDetailsThumbnail";
import AlbumGalleryImages from "./AlbumGalleryImages";

const MAX_IMAGES = 50;
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const ACCEPTED_FORMATS = ACCEPTED_TYPES.join(",");

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

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

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggedKey, setDraggedKey] = useState(null);

  const busy = saving || uploading;

  // Keep the ordered image list available to both the UI and save logic.
  const allImages = useMemo(() => orderedImages, [orderedImages]);

  // Adapt image data to the gallery component's expected shape.
  // This hook must remain above conditional returns.
  const galleryImages = useMemo(
    () =>
      allImages.map((item) => ({
        ...item,
        preview:
          item.type === "new" ? item.preview : getImageUrl(item.image, album),
      })),
    [allImages, album],
  );

  const thumbnailPreview = thumbnailFile?.preview
    ? thumbnailFile.preview
    : getImageUrl(existingThumbnail, album);

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

  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    },
    [],
  );

  // Fetch the album.
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

        if (!fetchedAlbum?._id || (id && fetchedAlbum._id !== id)) {
          const response = await API.get(`/get-album/${id}`);
          fetchedAlbum = normalizeAlbumResponse(response.data);
        }

        if (!fetchedAlbum?._id) {
          throw new Error("Album details were not returned by the server.");
        }

        if (active) {
          setAlbum(fetchedAlbum);
        }
      } catch (error) {
        if (active) {
          const message = getErrorMessage(error).replace(
            "Something went wrong. Please try again.",
            "Failed to load album.",
          );

          setAlbumError(message);
          toast.error(message);
        }
      } finally {
        if (active) {
          setLoadingAlbum(false);
        }
      }
    };

    fetchAlbum();

    return () => {
      active = false;
    };
  }, [id, initialAlbum]);

  // Initialize the form when the album data is available.
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

    files.forEach((file) => {
      const error = validateFile(file);

      if (error) {
        toast.error(error);
      } else {
        acceptedFiles.push(file);
      }
    });

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

  // Called by the gallery component when the user reorders images.
  const moveImage = (sourceKey, targetKey) => {
    if (!sourceKey || !targetKey || sourceKey === targetKey) return;

    setOrderedImages((current) => {
      const reordered = [...current];

      const sourceIndex = reordered.findIndex((item) => item.key === sourceKey);
      const targetIndex = reordered.findIndex((item) => item.key === targetKey);

      if (sourceIndex < 0 || targetIndex < 0) return current;

      const [moved] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, moved);

      return reordered;
    });
  };

  // Called by the gallery component when an image is removed.
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

  const handleSave = async (event) => {
    event?.preventDefault();

    if (busy) return;

    if (!album?._id) {
      toast.error("Album ID is missing.");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter an album name.");
      return;
    }

    if (name.trim().length > 150) {
      toast.error("Album name cannot exceed 150 characters.");
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

    let sessionId = null;

    try {
      const newImageItems = orderedImages.filter((item) => item.type === "new");

      let uploadedImages = [];

      // Upload new images and/or the replacement thumbnail.
      if (newImageItems.length || thumbnailFile) {
        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();

        if (thumbnailFile) {
          formData.append("thumbnail", thumbnailFile.file);
        }

        newImageItems.forEach((item) => {
          formData.append("images", item.file);
        });

        const uploadResponse = await API.post("/upload", formData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              setUploadProgress(
                Math.round((progressEvent.loaded / progressEvent.total) * 100),
              );
            }
          },
        });

        const uploadData = uploadResponse.data?.data;
        sessionId = uploadData?.sessionId;
        uploadedImages = uploadData?.images || [];

        if (!sessionId) {
          throw new Error("Could not create an upload session.");
        }

        if (uploadedImages.length !== newImageItems.length) {
          throw new Error("Uploaded image count does not match selection.");
        }
      }

      // Preserve the user's chosen order for both existing and new images.
      let newImageIndex = 0;

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

      // Existing images removed from the UI should be removed by the server.
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
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
      setUploadProgress(0);
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

  return (
    <Box
      component="form"
      onSubmit={handleSave}
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
            Edit Album
          </Typography>

          <Typography color="text.secondary" mt={0.5}>
            Update the cover image and organize your gallery photos.
          </Typography>
        </Box>
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
          <AlbumDetailsThumbnail
            name={name}
            setName={setName}
            thumbnailInputRef={thumbnailInputRef}
            handleThumbnailChange={handleThumbnailChange}
            thumbnailPreview={thumbnailPreview}
            ACCEPTED_FORMATS={ACCEPTED_FORMATS}
            thumbnailFile={thumbnailFile}
            existingThumbnail={existingThumbnail}
            handleUndoThumbnail={handleUndoThumbnail}
            busy={busy}
            formatFileSize={formatFileSize}
          />
          <AlbumGalleryImages
            images={galleryImages}
            imagesInputRef={imagesInputRef}
            handleImagesChange={handleImagesChange}
            uploadProgress={uploadProgress}
            uploading={uploading}
            busy={busy}
            removingId={null}
            draggedId={draggedKey}
            setDraggedId={setDraggedKey}
            moveImage={moveImage}
            removeImage={removeImage}
            formatFileSize={formatFileSize}
            maxImages={MAX_IMAGES}
          />
        </Box>

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
            onClick={handleCancel}
            disabled={busy}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={busy}
            startIcon={
              busy ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Icon name="save" />
              )
            }
          >
            {saving
              ? "Saving changes..."
              : uploading
                ? "Uploading files..."
                : "Save changes"}
          </Button>
        </Box>
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
        originalName: PropTypes.string,
        size: PropTypes.number,
      }),
    ]),
    images: PropTypes.array,
  }),
  onCancel: PropTypes.func,
  onSaved: PropTypes.func,
};
