import PropTypes from "prop-types";

const EditorLeaf = ({ attributes, children, leaf }) => {
  let content = children;

  if (leaf.bold) content = <strong>{content}</strong>;
  if (leaf.italic) content = <em>{content}</em>;
  if (leaf.underline) content = <u>{content}</u>;

  return (
    <span
      {...attributes}
      style={{ whiteSpace: "pre-wrap" }}
    >
      {content}
    </span>
  );
};

EditorLeaf.propTypes = {
  attributes: PropTypes.object.isRequired,
  children: PropTypes.node,
  leaf: PropTypes.shape({
    text: PropTypes.string,
    bold: PropTypes.bool,
    italic: PropTypes.bool,
    underline: PropTypes.bool,
  }).isRequired,
};

export default EditorLeaf;