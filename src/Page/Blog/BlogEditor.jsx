import { Box, Typography } from "@mui/material";
import BlogEditorPage from "../../Components/Blog/BlogEditorPage";

export default function BlogEditor() {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: "48px" }}>
        Blog Editor
      </Typography>
      <BlogEditorPage />
    </Box>
  );
}
