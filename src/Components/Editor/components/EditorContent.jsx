import { useCallback } from "react";
import PropTypes from "prop-types";
import { Editable } from "slate-react";

import EditorElement from "./EditorElement";
import EditorLeaf from "./EditorLeaf";

const EditorContent = ({ editor, sessionId }) => {
  const renderElement = useCallback(
    (props) => <EditorElement {...props} editor={editor} sessionId={sessionId} />,
    [editor]
  );

  const renderLeaf = useCallback(
    (props) => <EditorLeaf {...props} />,
    []
  );

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      editor.insertText("\n");
    }
  };

  return (
    <Editable
      placeholder="Type something..."
      onKeyDown={handleKeyDown}
      renderElement={renderElement}
      renderLeaf={renderLeaf}
      style={{
        minHeight: "200px",
        lineHeight: "1.2",
        padding: "10px",
        background: "#f6f7f8",
      }}
      renderPlaceholder={({ attributes, children }) => (
        <div
          {...attributes}
          style={{
            ...attributes.style,
            top: "10px",
            left: "10px",
            opacity: 0.5,
            position: "absolute",
          }}
        >
          {children}
        </div>
      )}
    />
  );
};

EditorContent.propTypes = {
  editor: PropTypes.object.isRequired,
  sessionId: PropTypes.string,
};

export default EditorContent;