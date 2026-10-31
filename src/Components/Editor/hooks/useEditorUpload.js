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

export const useEditorUpload = ({ editor, uploadConfig }) => {
  const handleImageUpload = async (file) => {
    if (!file) return;

    const {
      uploadUrl,
      sessionId,
      sessionHeader,
      imageField = "image",
    } = uploadConfig || {};

    if (!uploadUrl) {
      throw new Error("Image upload is not configured for this editor.");
    }

    if (sessionHeader && !sessionId) {
      throw new Error("The image upload session is not ready.");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Please select a valid image.");
    }

    if (file.size < 1 || file.size > 2 * 1024 * 1024) {
      throw new Error("Editor images must be 2 MB or smaller.");
    }

    try {
      const dimensions = await getImageDimensions(file);
      const formData = new FormData();
      formData.append(imageField, file);

      const headers = { "Content-Type": "multipart/form-data" };
      if (sessionHeader) headers[sessionHeader] = sessionId;

      const response = await axios.post(uploadUrl, formData, { headers });
      const { url, filename } = response.data?.data || {};

      if (!url || !filename) {
        throw new Error("Invalid editor image upload response.");
      }

      insertImage(editor, url, filename, dimensions);
      return { url, filename, ...dimensions };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || "Image upload failed.",
      );
    }
  };

  return { handleImageUpload };
};
