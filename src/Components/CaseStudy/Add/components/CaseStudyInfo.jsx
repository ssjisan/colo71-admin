import PropTypes from "prop-types";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { CloudUploadOutlined, DeleteOutline } from "@mui/icons-material";

export default function CaseStudyInfo({ title, setTitle, summary, setSummary, clientName, setClientName, industry, setIndustry, projectLocation, setProjectLocation, completionDate, setCompletionDate, projectType, setProjectType, coverFile, coverPreview, onCoverChange, onRemoveCover, disabled = false }) {
  return <Stack spacing={3}>
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      <Stack spacing={3}>
        <Box><Typography variant="h6" fontWeight={600}>Case study information</Typography><Typography variant="body2" color="text.secondary">Add the key details that describe this project.</Typography></Box>
        <TextField label="Case study title" placeholder="Enter a descriptive project title" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth disabled={disabled} inputProps={{ maxLength: 200 }} helperText={`${title.length}/200 characters`} />
        <TextField label="Short summary" placeholder="A short overview for the case study listing" value={summary} onChange={(e) => setSummary(e.target.value)} multiline minRows={3} fullWidth disabled={disabled} inputProps={{ maxLength: 500 }} helperText={`${summary.length}/500 characters`} />
        <TextField label="Client name" placeholder="Client name or Confidential Client" value={clientName} onChange={(e) => setClientName(e.target.value)} fullWidth disabled={disabled} />
        <TextField label="Industry" placeholder="e.g. Banking, Healthcare, Technology" value={industry} onChange={(e) => setIndustry(e.target.value)} required fullWidth disabled={disabled} />
        <TextField label="Project location" placeholder="e.g. Dhaka, Bangladesh" value={projectLocation} onChange={(e) => setProjectLocation(e.target.value)} fullWidth disabled={disabled} />
        <TextField label="Project type" placeholder="e.g. Data Center Design & Build" value={projectType} onChange={(e) => setProjectType(e.target.value)} required fullWidth disabled={disabled} />
        <TextField label="Project completion date" type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} fullWidth disabled={disabled} InputLabelProps={{ shrink: true }} />
      </Stack>
    </Paper>
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Box><Typography variant="h6" fontWeight={600}>Cover image</Typography><Typography variant="body2" color="text.secondary">JPG, PNG, WEBP, GIF, or AVIF. Maximum size: 5 MB.</Typography></Box>
        {coverPreview ? <Box>
          <Box component="img" src={coverPreview} alt="Case study cover preview" sx={{ display: "block", width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 2, bgcolor: "action.hover" }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} mt={1}>
            <Typography variant="body2" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{coverFile?.name}</Typography>
            <Button color="error" startIcon={<DeleteOutline />} onClick={onRemoveCover} disabled={disabled}>Remove</Button>
          </Stack>
        </Box> : <Box sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 2, p: { xs: 3, md: 4 }, textAlign: "center", bgcolor: "action.hover" }}>
          <CloudUploadOutlined sx={{ fontSize: 42, color: "text.secondary", mb: 1 }} />
          <Typography fontWeight={600}>Choose a cover image</Typography>
          <Button component="label" variant="outlined" disabled={disabled} sx={{ mt: 2 }}>Choose image<input hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={onCoverChange} /></Button>
        </Box>}
      </Stack>
    </Paper>
  </Stack>;
}
CaseStudyInfo.propTypes = {
  title: PropTypes.string.isRequired, setTitle: PropTypes.func.isRequired, summary: PropTypes.string.isRequired, setSummary: PropTypes.func.isRequired,
  clientName: PropTypes.string.isRequired, setClientName: PropTypes.func.isRequired, industry: PropTypes.string.isRequired, setIndustry: PropTypes.func.isRequired,
  projectLocation: PropTypes.string.isRequired, setProjectLocation: PropTypes.func.isRequired, completionDate: PropTypes.string.isRequired, setCompletionDate: PropTypes.func.isRequired,
  projectType: PropTypes.string.isRequired, setProjectType: PropTypes.func.isRequired, coverFile: PropTypes.object, coverPreview: PropTypes.string,
  onCoverChange: PropTypes.func.isRequired, onRemoveCover: PropTypes.func.isRequired, disabled: PropTypes.bool,
};
