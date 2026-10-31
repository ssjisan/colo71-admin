import { useMemo } from "react";
import PropTypes from "prop-types";

import { createEditor } from "slate";
import { Slate, withReact } from "slate-react";
import { withHistory } from "slate-history";

import EditorToolbar from "./EditorToolbar";
import EditorContent from "./components/EditorContent";

import { withImages, createInitialValue } from "./utils/editorConfig";

import {
  toggleMark,
  toggleBlock,
  toggleAlign,
  isMarkActive,
  isBlockActive,
  isAlignActive,
} from "./utils/editorHelpers";

import { serializeEditorValue } from "./utils/editorSerializer";
import { useEditorUpload } from "./hooks/useEditorUpload";

import "./styles/editor.css";

const Editor = ({ value, onChangeValue, setUploadedImages, sessionId }) => {
  const editor = useMemo(
    () => withImages(withHistory(withReact(createEditor()))),
    [],
  );

  const initialValue = useMemo(() => createInitialValue(value), []);

  const { handleImageUpload } = useEditorUpload({
    editor,
    setUploadedImages,
    sessionId,
  });

  const handleChange = (newValue) => {
    if (onChangeValue) {
      const html = serializeEditorValue(newValue);
      onChangeValue(newValue, html);
    }
  };

  return (
    <div className="rich-editor">
      <Slate
        editor={editor}
        initialValue={initialValue}
        onChange={handleChange}
      >
        <EditorToolbar
          editor={editor}
          toggleMark={toggleMark}
          toggleBlock={toggleBlock}
          toggleAlign={toggleAlign}
          isMarkActive={isMarkActive}
          isBlockActive={isBlockActive}
          isAlignActive={isAlignActive}
          handleImageUpload={handleImageUpload}
        />

        <EditorContent editor={editor} sessionId={sessionId} />
      </Slate>
    </div>
  );
};

Editor.propTypes = {
  value: PropTypes.array,
  onChangeValue: PropTypes.func,
  uploadedImages: PropTypes.array,
  setUploadedImages: PropTypes.func,
  sessionId: PropTypes.string,
};

export default Editor;
