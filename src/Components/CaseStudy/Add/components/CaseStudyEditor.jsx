import { useState } from "react";
import PropTypes from "prop-types";
import { Box, Checkbox, Divider, FormControlLabel, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { Fullscreen, FullscreenExit } from "@mui/icons-material";
import Editor from "../../../Editor/Editor";

export default function CaseStudyEditor({ editorValue, onEditorChange, featured, setFeatured, published, setPublished, sessionId, disabled = false }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorPaperSx = isFullscreen
    ? { position: "fixed", inset: 0, zIndex: (theme) => theme.zIndex.modal + 1, width: "100vw", height: "100dvh", maxWidth: "none", borderRadius: 0, p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "background.paper" }
    : { p: { xs: 2, md: 3 }, borderRadius: 3 };
  return <Stack spacing={3}>
    <Paper variant="outlined" sx={editorPaperSx}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2, flexShrink: 0 }}>
        <Box><Typography variant="h6" fontWeight={600}>Case study content</Typography><Typography variant="body2" color="text.secondary">Tell the complete project story: challenge, requirements, solution, implementation, and results.</Typography></Box>
        <Tooltip title={isFullscreen ? "Exit fullscreen" : "Open fullscreen editor"}><IconButton onClick={() => setIsFullscreen((prev) => !prev)} color="primary" size="large" sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, flexShrink: 0 }}>{isFullscreen ? <FullscreenExit /> : <Fullscreen />}</IconButton></Tooltip>
      </Stack>
      <Divider sx={{ mb: 2, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0, minHeight: 0, flex: isFullscreen ? 1 : "none", overflow: isFullscreen ? "auto" : "visible" }}>
        <Editor value={editorValue} onChangeValue={onEditorChange} uploadConfig={{ uploadUrl: "/case-studies/upload-session/editor-image", deleteUrl: (filename) => `/case-studies/upload-session/editor-image/${encodeURIComponent(filename)}`, sessionHeader: "x-upload-session-id", sessionId, imageField: "image", temporaryPath: "/file-storage/case-study/temp/" }} />
      </Box>
    </Paper>
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      <Stack spacing={2}><Typography variant="h6" fontWeight={600}>Publication settings</Typography>
        <FormControlLabel control={<Checkbox checked={featured} onChange={(e) => setFeatured(e.target.checked)} disabled={disabled} />} label={<Box><Typography fontWeight={500}>Featured case study</Typography><Typography variant="body2" color="text.secondary">Include this project in the featured case studies section when published.</Typography></Box>} sx={{ alignItems: "flex-start", m: 0 }} />
        <Divider />
        <FormControlLabel control={<Checkbox checked={published} onChange={(e) => setPublished(e.target.checked)} disabled={disabled} />} label={<Box><Typography fontWeight={500}>Publish immediately</Typography><Typography variant="body2" color="text.secondary">Published case studies are visible through the public case studies API.</Typography></Box>} sx={{ alignItems: "flex-start", m: 0 }} />
      </Stack>
    </Paper>
  </Stack>;
}
CaseStudyEditor.propTypes = { editorValue: PropTypes.array.isRequired, onEditorChange: PropTypes.func.isRequired, featured: PropTypes.bool.isRequired, setFeatured: PropTypes.func.isRequired, published: PropTypes.bool.isRequired, setPublished: PropTypes.func.isRequired, sessionId: PropTypes.string.isRequired, disabled: PropTypes.bool };
