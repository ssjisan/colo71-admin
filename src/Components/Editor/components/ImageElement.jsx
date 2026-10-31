import PropTypes from "prop-types";
import { useSelected, useFocused, ReactEditor } from "slate-react";
import { Transforms } from "slate";
import axios from "../../../api/axios";
import toast from "react-hot-toast";
import { resolveAssetUrl } from "../utils/assetUrl";

const ImageElement = ({
  attributes,
  children,
  element,
  editor,
  uploadConfig,
}) => {
  const selected = useSelected();
  const focused = useFocused();

  const removeImage = async () => {
    const path = ReactEditor.findPath(editor, element);
    Transforms.removeNodes(editor, { at: path });

    const { deleteUrl, sessionHeader, sessionId, temporaryPath } =
      uploadConfig || {};
    const isTemporaryImage =
      typeof temporaryPath === "string" &&
      temporaryPath.length > 0 &&
      typeof element.url === "string" &&
      element.url.includes(temporaryPath);

    if (
      !element.filename ||
      !isTemporaryImage ||
      typeof deleteUrl !== "function"
    ) {
      return;
    }

    try {
      const headers = {};
      if (sessionHeader) headers[sessionHeader] = sessionId;

      await axios.delete(deleteUrl(element.filename), { headers });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not remove temporary image.",
      );
    }
  };

  const handleResize = (event) => {
    event.preventDefault();

    const startX = event.clientX;
    const imageElement = event.currentTarget.parentElement.querySelector("img");
    if (!imageElement) return;

    const startWidth = imageElement.offsetWidth;

    const onMouseMove = (moveEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));

      try {
        const path = ReactEditor.findPath(editor, element);
        Transforms.setNodes(editor, { width: newWidth }, { at: path });
      } catch (error) {
        console.error("Image resize failed:", error);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div {...attributes}>
      <div
        contentEditable={false}
        style={{
          position: "relative",
          textAlign: element.align || "left",
          userSelect: "none",
        }}
      >
        <div style={{ display: "inline-block", position: "relative" }}>
          <img
            src={resolveAssetUrl(element.url)}
            alt=""
            style={{
              display: "block",
              maxWidth: "100%",
              width: element.width || "auto",
              height: "auto",
              boxShadow: selected && focused ? "0 0 0 3px #B4D5FF" : "none",
            }}
          />

          {selected && focused && (
            <>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  removeImage();
                }}
                style={{
                  position: "absolute",
                  top: "5px",
                  left: "5px",
                  background: "white",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer",
                  padding: "2px 8px",
                  zIndex: 10,
                }}
              >
                Delete
              </button>

              <div
                onMouseDown={handleResize}
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "12px",
                  height: "12px",
                  background: "#4A90E2",
                  cursor: "nwse-resize",
                  border: "1px solid white",
                }}
              />
            </>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

ImageElement.propTypes = {
  attributes: PropTypes.object.isRequired,
  children: PropTypes.node,
  element: PropTypes.object.isRequired,
  editor: PropTypes.object.isRequired,
  uploadConfig: PropTypes.object,
};

export default ImageElement;
