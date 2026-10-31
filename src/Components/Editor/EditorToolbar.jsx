import { useRef } from "react";
import toast from "react-hot-toast";
import { Stack } from "@mui/material";
import PropTypes from "prop-types";

import {
  EditorBold,
  EditorCenter,
  EditorHeading1,
  EditorHeading2,
  EditorHeading3,
  EditorHeading4,
  EditorHeading5,
  EditorHeading6,
  EditorImage,
  EditorItalic,
  EditorJustify,
  EditorLeft,
  EditorListOrdered,
  EditorListUnordered,
  EditorQuote,
  EditorRight,
  EditorUnderline,
} from "../../assets/editor/EditorIcons";

import ToolbarButton from "./components/ToolbarButton";
import ToolbarDivider from "./components/ToolbarDivider";

export default function EditorToolbar({
  toggleMark,
  toggleBlock,
  editor,
  toggleAlign,
  handleImageUpload,
  isMarkActive,
  isBlockActive,
  isAlignActive,
}) {
  const fileInputRef = useRef(null);

  const headingButtons = [
    { format: "heading-one", Icon: EditorHeading1 },
    { format: "heading-two", Icon: EditorHeading2 },
    { format: "heading-three", Icon: EditorHeading3 },
    { format: "heading-four", Icon: EditorHeading4 },
    { format: "heading-five", Icon: EditorHeading5 },
    { format: "heading-six", Icon: EditorHeading6 },
  ];

  const markButtons = [
    { format: "bold", Icon: EditorBold },
    { format: "italic", Icon: EditorItalic },
    { format: "underline", Icon: EditorUnderline },
  ];

  const listButtons = [
    { format: "bulleted-list", Icon: EditorListUnordered },
    { format: "numbered-list", Icon: EditorListOrdered },
  ];

  const alignmentButtons = [
    { format: "left", Icon: EditorLeft },
    { format: "center", Icon: EditorCenter },
    { format: "right", Icon: EditorRight },
    { format: "justify", Icon: EditorJustify },
  ];

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (file) {
      try {
        await handleImageUpload(file);
      } catch (error) {
        toast.error(error.message || "Image upload failed.");
      }
    }

    event.target.value = "";
  };

  return (
    <Stack
      flexWrap="wrap"
      flexDirection="row"
      gap="4px"
      sx={{
        padding: "12px",
        background: "#fff",
      }}
    >
      {headingButtons.map(({ format, Icon }) => (
        <ToolbarButton
          key={format}
          icon={Icon}
          label={format}
          iconSize="24px"
          active={isBlockActive(editor, format)}
          onMouseDown={(event) => {
            event.preventDefault();
            toggleBlock(editor, format);
          }}
        />
      ))}

      <ToolbarDivider />

      <Stack gap="4px" flexDirection="row">
        {markButtons.map(({ format, Icon }) => (
          <ToolbarButton
            key={format}
            icon={Icon}
            label={format}
            active={isMarkActive(editor, format)}
            onMouseDown={(event) => {
              event.preventDefault();
              toggleMark(editor, format);
            }}
          />
        ))}

        <ToolbarButton
          icon={EditorQuote}
          label="Block quote"
          active={isBlockActive(editor, "block-quote")}
          onMouseDown={(event) => {
            event.preventDefault();
            toggleBlock(editor, "block-quote");
          }}
        />
      </Stack>

      <ToolbarDivider />

      <Stack gap="4px" flexDirection="row">
        {listButtons.map(({ format, Icon }) => (
          <ToolbarButton
            key={format}
            icon={Icon}
            label={format}
            active={isBlockActive(editor, format)}
            onMouseDown={(event) => {
              event.preventDefault();
              toggleBlock(editor, format);
            }}
          />
        ))}
      </Stack>

      <ToolbarDivider />

      <Stack gap="4px" flexDirection="row">
        {alignmentButtons.map(({ format, Icon }) => (
          <ToolbarButton
            key={format}
            icon={Icon}
            label={`Align ${format}`}
            active={isAlignActive(editor, format)}
            onMouseDown={(event) => {
              event.preventDefault();
              toggleAlign(editor, format);
            }}
          />
        ))}
      </Stack>

      <ToolbarDivider />

      <Stack>
        <ToolbarButton
          icon={EditorImage}
          label="Insert image"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
      </Stack>
    </Stack>
  );
}

EditorToolbar.propTypes = {
  toggleMark: PropTypes.func.isRequired,
  toggleBlock: PropTypes.func.isRequired,
  toggleAlign: PropTypes.func.isRequired,
  handleImageUpload: PropTypes.func.isRequired,
  editor: PropTypes.object.isRequired,
  isMarkActive: PropTypes.func.isRequired,
  isBlockActive: PropTypes.func.isRequired,
  isAlignActive: PropTypes.func.isRequired,
};
