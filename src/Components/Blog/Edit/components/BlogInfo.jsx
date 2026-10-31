
import PropTypes from "prop-types";

import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { CloudUploadOutlined, DeleteOutline } from "@mui/icons-material";

export default function BlogInfo({
  title,
  setTitle,
  excerpt,
  setExcerpt,
  coverFile,
  coverPreview,
  onCoverChange,
  onRemoveCover,
  disabled = false,
}) {
  return (
    <Stack spacing={3}>
      {/* Blog Information */}
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Blog information
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Add the basic details of your blog post.
            </Typography>
          </Box>

          <TextField
            label="Blog title"
            placeholder="Enter a descriptive blog title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            disabled={disabled}
            inputProps={{ maxLength: 200 }}
            helperText={`${title.length}/200 characters`}
          />

          <TextField
            label="Short excerpt"
            placeholder="A short introduction for the blog listing"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            multiline
            minRows={4}
            fullWidth
            disabled={disabled}
            inputProps={{ maxLength: 500 }}
            helperText={`${excerpt.length}/500 characters`}
          />
        </Stack>
      </Paper>

      {/* Cover Image */}
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Cover image
            </Typography>

            <Typography variant="body2" color="text.secondary">
              JPG, PNG, WEBP, GIF, or AVIF. Maximum size: 5 MB.
            </Typography>
          </Box>

          {coverPreview ? (
            <Box>
              <Box
                component="img"
                src={coverPreview}
                alt="Blog cover preview"
                sx={{
                  display: "block",
                  width: "100%",
                  maxHeight: 320,
                  objectFit: "cover",
                  borderRadius: 2,
                  bgcolor: "action.hover",
                }}
              />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
                mt={1}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {coverFile?.name}
                </Typography>

                <Button
                  color="error"
                  startIcon={<DeleteOutline />}
                  onClick={onRemoveCover}
                  disabled={disabled}
                >
                  Remove
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box
              sx={{
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 2,
                p: { xs: 3, md: 4 },
                textAlign: "center",
                bgcolor: "action.hover",
              }}
            >
              <CloudUploadOutlined
                sx={{
                  fontSize: 42,
                  color: "text.secondary",
                  mb: 1,
                }}
              />

              <Typography fontWeight={600}>
                Choose a cover image
              </Typography>

              <Button
                component="label"
                variant="outlined"
                disabled={disabled}
                sx={{ mt: 2 }}
              >
                Choose image

                <input
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  onChange={onCoverChange}
                />
              </Button>
            </Box>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

BlogInfo.propTypes = {
  title: PropTypes.string.isRequired,
  setTitle: PropTypes.func.isRequired,

  excerpt: PropTypes.string.isRequired,
  setExcerpt: PropTypes.func.isRequired,

  coverFile: PropTypes.oneOfType([
    PropTypes.instanceOf(File),
    PropTypes.oneOf([null]),
  ]),

  coverPreview: PropTypes.string,

  onCoverChange: PropTypes.func.isRequired,
  onRemoveCover: PropTypes.func.isRequired,

  disabled: PropTypes.bool,
};

BlogInfo.defaultProps = {
  coverFile: null,
  coverPreview: "",
  disabled: false,
};
