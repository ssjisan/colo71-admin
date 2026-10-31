import PropTypes from "prop-types";
import ImageElement from "./ImageElement";

const EditorElement = ({
  attributes,
  children,
  element,
  editor,
  onRemoveImage,
  uploadConfig,
}) => {
  const combinedStyle = {
    margin: "0 0 10px 0",
    lineHeight: "1.2",
    textAlign: element.align || "left",
  };

  switch (element.type) {
    case "image":
      return (
        <ImageElement
          attributes={attributes}
          element={element}
          editor={editor}
          onRemoveImage={onRemoveImage}
          uploadConfig={uploadConfig}
        >
          {children}
        </ImageElement>
      );

    case "block-quote":
      return (
        <blockquote
          {...attributes}
          style={{
            ...combinedStyle,
            borderLeft: "4px solid #4A90E2",
            background: "#f7f9fc",
            padding: "10px 14px",
            margin: "12px 0",
            fontStyle: "italic",
            color: "#444",
          }}
        >
          {children}
        </blockquote>
      );

    case "heading-one":
      return <h1 {...attributes} style={combinedStyle}>{children}</h1>;

    case "heading-two":
      return <h2 {...attributes} style={combinedStyle}>{children}</h2>;

    case "heading-three":
      return <h3 {...attributes} style={combinedStyle}>{children}</h3>;

    case "heading-four":
      return <h4 {...attributes} style={combinedStyle}>{children}</h4>;

    case "heading-five":
      return <h5 {...attributes} style={combinedStyle}>{children}</h5>;

    case "heading-six":
      return <h6 {...attributes} style={combinedStyle}>{children}</h6>;

    case "numbered-list":
      return <ol {...attributes} style={combinedStyle}>{children}</ol>;

    case "bulleted-list":
      return <ul {...attributes} style={combinedStyle}>{children}</ul>;

    case "list-item":
      return <li {...attributes}>{children}</li>;

    default:
      return <p {...attributes} style={combinedStyle}>{children}</p>;
  }
};

EditorElement.propTypes = {
  attributes: PropTypes.object.isRequired,
  children: PropTypes.node,
  element: PropTypes.object.isRequired,
  editor: PropTypes.object.isRequired,
  onRemoveImage: PropTypes.func,
  uploadConfig: PropTypes.object,
};

export default EditorElement;