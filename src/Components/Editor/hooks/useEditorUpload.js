import axios from "../../../api/axios";
import { insertImage } from "../utils/editorConfig";

const getImageDimensions = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });

      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image dimensions."));
    };

    image.src = objectUrl;
  });

export const useEditorUpload = ({
  editor,
  setUploadedImages,
  sessionId,
}) => {
  const handleImageUpload = async (file) => {
    if (!file) return;

    if (!sessionId) {
      throw new Error("The blog upload session is not ready.");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Please select a valid image.");
    }

    if (file.size < 1 || file.size > 2 * 1024 * 1024) {
      throw new Error("Editor images must be 2 MB or smaller.");
    }

    try {
      // Read original dimensions before upload
      const dimensions = await getImageDimensions(file);

      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(
        "/blogs/upload-session/editor-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "x-upload-session-id": sessionId,
          },
        },
      );

      const { url, filename } = response.data?.data || {};

      if (!url || !filename) {
        throw new Error("Invalid editor image upload response.");
      }

      // Insert image with its original dimensions
      insertImage(editor, url, filename, dimensions);

      setUploadedImages?.((previous = []) => [
        ...previous,
        filename,
      ]);

      return { url, filename, ...dimensions };
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Image upload failed.",
      );
    }
  };

  return { handleImageUpload };
};