import { IconButton } from "@mui/material";
import PropTypes from "prop-types";

export const editorToolIconStyle = {
  width: "24px",
  height: "24px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: "4px",
};

const ToolbarButton = ({
  icon: Icon,
  active = false,
  onMouseDown,
  iconSize = "16px",
  label,
  onClick
}) => {
  return (
    <IconButton
      aria-label={label}
      title={label}
      size="small"
      sx={{
        ...editorToolIconStyle,
        background: active ? "#e6f0ff" : "transparent",
      }}
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      <Icon size={iconSize} color="#1c252e" />
    </IconButton>
  );
};

ToolbarButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  active: PropTypes.bool,
  onMouseDown: PropTypes.func,
  onClick: PropTypes.func,
  iconSize: PropTypes.string,
  label: PropTypes.string,
};

export default ToolbarButton;