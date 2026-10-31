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

const Editor = ({ value, onChangeValue, uploadConfig }) => {
  const editor = useMemo(
    () => withImages(withHistory(withReact(createEditor()))),
    [],
  );

  const initialValue = useMemo(() => createInitialValue(value), []);
  const { handleImageUpload } = useEditorUpload({ editor, uploadConfig });

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
        <div className="editor-toolbar">
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
        </div>
        <EditorContent editor={editor} uploadConfig={uploadConfig} />
      </Slate>
    </div>
  );
};

Editor.propTypes = {
  value: PropTypes.array,
  onChangeValue: PropTypes.func,
  uploadConfig: PropTypes.shape({
    uploadUrl: PropTypes.string,
    deleteUrl: PropTypes.func,
    sessionHeader: PropTypes.string,
    sessionId: PropTypes.string,
    imageField: PropTypes.string,
    temporaryPath: PropTypes.string,
  }),
};

export default Editor;
