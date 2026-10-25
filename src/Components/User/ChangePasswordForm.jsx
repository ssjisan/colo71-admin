import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import axios from "../../api/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../../DataProcessing/DataProcessing";
import Icon from "../Icon";

const EMPTY_AUTH = {
  user: null,
  permissions: [],
};

export default function ChangePasswordForm() {
  const { setAuth } = useContext(DataContext);
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const passwordRules = [
    {
      label: "At least 8 characters",
      valid: newPassword.length >= 8,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(newPassword),
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(newPassword),
    },
    {
      label: "One number",
      valid: /\d/.test(newPassword),
    },
    {
      label: "One special character",
      valid: /[^A-Za-z0-9]/.test(newPassword),
    },
  ];

  const isPasswordValid = passwordRules.every((rule) => rule.valid);

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (loading) return;

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (!isPasswordValid) {
      toast.error("Please meet all password requirements");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    if (oldPassword === newPassword) {
      toast.error("Your new password must be different from your old password");
      return;
    }

    try {
      setLoading(true);

      // Authentication is handled through HTTP-only cookies.
      const response = await axios.post("/change-own-password", {
        currentPassword: oldPassword,
        newPassword,
        confirmPassword,
      });
      if (response.data?.success === false) {
        toast.error(response.data?.message || "Unable to change password");
        return;
      }

      toast.success(
        response.data?.message ||
          "Password changed successfully. Please login again.",
      );

      // The backend should revoke existing sessions and clear auth cookies.
      setAuth(EMPTY_AUTH);

      // Remove legacy client-side tokens if they exist.
      sessionStorage.removeItem("auth");
      localStorage.removeItem("auth");
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");

      navigate("/login", { replace: true });
    } catch (error) {
      const status = error.response?.status;
      const errorMessage =
        error.response?.data?.message || "Unable to change password";

      toast.error(errorMessage);

      if (status === 401 || status === 403) {
        setAuth(EMPTY_AUTH);
        sessionStorage.removeItem("auth");
        localStorage.removeItem("auth");
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");

        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleChangePassword}
      sx={{ width: "100%" }}
    >
      <Box sx={{ p: "24px 24px 0 0" }}>
        <Typography variant="h4">Change your password</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Choose a strong password to secure your account.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          width: "100%",
          maxWidth: "420px",
          mt: "40px",
          mb: "80px",
        }}
      >
        <FormControl variant="outlined" fullWidth>
          <InputLabel htmlFor="old-password">Current Password</InputLabel>
          <OutlinedInput
            id="old-password"
            name="currentPassword"
            type={showOldPassword ? "text" : "password"}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            autoComplete="current-password"
            label="Current Password"
            required
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  type="button"
                  aria-label={
                    showOldPassword
                      ? "Hide current password"
                      : "Show current password"
                  }
                  onClick={() => setShowOldPassword((value) => !value)}
                  edge="end"
                >
                  <Icon
                    name={showOldPassword ? "eyeoff" : "eyeon"}
                    color="#918EAF"
                    size="24px"
                  />
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>

        <FormControl variant="outlined" fullWidth>
          <InputLabel htmlFor="new-password">New Password</InputLabel>
          <OutlinedInput
            id="new-password"
            name="newPassword"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            label="New Password"
            required
            error={Boolean(newPassword) && !isPasswordValid}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  type="button"
                  aria-label={
                    showNewPassword ? "Hide new password" : "Show new password"
                  }
                  onClick={() => setShowNewPassword((value) => !value)}
                  edge="end"
                >
                  <Icon
                    name={showNewPassword ? "eyeoff" : "eyeon"}
                    color="#918EAF"
                    size="24px"
                  />
                </IconButton>
              </InputAdornment>
            }
          />

          <FormHelperText>
            {passwordRules.map((rule, index) => (
              <Box
                key={index}
                component="span"
                sx={{
                  display: "block",
                  color: !newPassword
                    ? "text.secondary"
                    : rule.valid
                      ? "success.main"
                      : "error.main",
                }}
              >
                {rule.valid && newPassword ? "✓ " : "• "}
                {rule.label}
              </Box>
            ))}
          </FormHelperText>
        </FormControl>

        <FormControl variant="outlined" fullWidth>
          <InputLabel htmlFor="confirm-password">
            Confirm New Password
          </InputLabel>
          <OutlinedInput
            id="confirm-password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            label="Confirm New Password"
            required
            error={Boolean(confirmPassword) && confirmPassword !== newPassword}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  type="button"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmation password"
                      : "Show confirmation password"
                  }
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  edge="end"
                >
                  <Icon
                    name={showConfirmPassword ? "eyeoff" : "eyeon"}
                    color="#918EAF"
                    size="24px"
                  />
                </IconButton>
              </InputAdornment>
            }
          />

          {confirmPassword && confirmPassword !== newPassword && (
            <FormHelperText error>Passwords do not match.</FormHelperText>
          )}
        </FormControl>

        <Button
          type="submit"
          variant="contained"
          disabled={
            loading ||
            !oldPassword ||
            !newPassword ||
            !confirmPassword ||
            !isPasswordValid ||
            newPassword !== confirmPassword ||
            oldPassword === newPassword
          }
          endIcon={
            loading ? (
              <Box
                component="img"
                src="/spinner.gif"
                alt=""
                sx={{ width: 24, height: 24 }}
              />
            ) : null
          }
        >
          {loading ? "Changing Password..." : "Change Password"}
        </Button>
      </Box>
    </Box>
  );
}
