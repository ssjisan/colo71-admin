import { useEffect, useState } from "react";
import API from "../../../api/axios";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Icon from "../../Icon";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

export default function InputField() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [sessionExpired, setSessionExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const resetToken = location.state?.resetToken;

  const forBelow776 = useMediaQuery("(max-width:776px)");

  // -----------------------------------------
  // Check reset session
  // -----------------------------------------

  useEffect(() => {
    if (!resetToken) {
      toast.error(
        "Your password reset session has expired. Please start again.",
      );

      navigate("/forgot-password", {
        replace: true,
      });
    }
  }, [resetToken, navigate]);

  // -----------------------------------------
  // Password validation
  // -----------------------------------------

  const validatePassword = (value) => {
    if (value.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (!/[A-Z]/.test(value)) {
      return "Password must contain at least one uppercase letter.";
    }

    if (!/[a-z]/.test(value)) {
      return "Password must contain at least one lowercase letter.";
    }

    if (!/[0-9]/.test(value)) {
      return "Password must contain at least one number.";
    }

    if (!/[^A-Za-z0-9]/.test(value)) {
      return "Password must contain at least one special character.";
    }

    return "";
  };

  // -----------------------------------------
  // Submit reset password
  // -----------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    // ---------------------------------------
    // Reset token check
    // ---------------------------------------

    if (!resetToken) {
      setSessionExpired(true);

      toast.error("Your password reset session has expired.");

      return;
    }

    // ---------------------------------------
    // Required fields
    // ---------------------------------------

    if (!password.trim()) {
      setMessage("Please enter your new password.");
      return;
    }

    if (!confirmPassword.trim()) {
      setMessage("Please confirm your new password.");
      return;
    }

    // ---------------------------------------
    // Password strength
    // ---------------------------------------

    const passwordError = validatePassword(password);

    if (passwordError) {
      setMessage(passwordError);
      return;
    }

    // ---------------------------------------
    // Confirm password
    // ---------------------------------------

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const toastId = toast.loading("Updating password...");

    try {
      const { data } = await API.post("/reset-forgot-password", {
        resetToken,
        newPassword: password,
        confirmPassword,
      });

      toast.dismiss(toastId);

      if (data.success) {
        toast.success("Password updated successfully.");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setMessage(data.message || "Failed to reset password.");
    } catch (error) {
      toast.dismiss(toastId);

      const errorData = error.response?.data;

      const errorMessage =
        errorData?.message || "Failed to reset password. Please try again.";

      setMessage(errorMessage);

      // ---------------------------------------
      // Reset session expired
      // ---------------------------------------

      if (errorData?.sessionExpired) {
        setSessionExpired(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // Expired session screen
  // -----------------------------------------

  if (sessionExpired) {
    return (
      <Stack
        justifyContent="center"
        alignItems="center"
        sx={{
          px: 4,
          height: "100%",
          minHeight: {
            xs: "80vh",
            sm: "80vh",
            md: "100vh",
          },
          textAlign: "center",
        }}
        gap={2}
      >
        <Stack
          sx={{
            width: "100%",
            maxWidth: "460px",
          }}
        >
          <Typography variant="h5">Password Reset Session Expired</Typography>

          <Typography variant="body2" color="text.secondary">
            Your password reset session has expired. Please request a new OTP to
            continue.
          </Typography>

          <Button
            variant="contained"
            sx={{
              mt: 5,
            }}
            onClick={() =>
              navigate("/forgot-password", {
                replace: true,
              })
            }
          >
            Go to Forgot Password
          </Button>
        </Stack>
      </Stack>
    );
  }

  // -----------------------------------------
  // Main component
  // -----------------------------------------

  return (
    <Stack
      sx={{
        px: 4,
        height: "100%",
        minHeight: {
          xs: "80vh",
          sm: "80vh",
          md: "100vh",
        },
        boxSizing: "border-box",
      }}
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        sx={{
          width: "100%",
          maxWidth: "460px",
        }}
      >
        <Typography variant="h5">Create New Password</Typography>

        <Typography variant="body2" color="text.secondary">
          Create a strong password that you haven&apos;t used before.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            width: "100%",
            mt: "40px",
            mb: forBelow776 ? "20px" : "40px",
          }}
        >
          <Stack gap="24px">
            {/* Error message */}
            {message && (
              <Stack
                direction="row"
                alignItems="center"
                sx={{
                  background: "#FFE9D5",
                  p: "8px 16px",
                  borderRadius: "12px",
                  minHeight: "48px",
                }}
              >
                <Icon name="alert" color="#FF5630" size="24px" />

                <Typography
                  variant="body2"
                  sx={{
                    color: "#FF5630",
                    ml: 1,
                  }}
                >
                  {message}
                </Typography>
              </Stack>
            )}

            {/* New password */}
            <TextField
              label="New Password"
              fullWidth
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setMessage("");
              }}
              type={showPassword ? "text" : "password"}
              helperText="Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character."
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <Icon name="eyeon" color="#918EAF" size="24px" />
                      ) : (
                        <Icon name="eyeoff" color="#918EAF" size="24px" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Confirm password */}
            <TextField
              label="Confirm Password"
              fullWidth
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setMessage("");
              }}
              type={showConfirmPassword ? "text" : "password"}
              error={confirmPassword.length > 0 && password !== confirmPassword}
              helperText={
                confirmPassword.length > 0 && password !== confirmPassword
                  ? "Passwords do not match."
                  : ""
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? (
                        <Icon name="eyeon" color="#918EAF" size="24px" />
                      ) : (
                        <Icon name="eyeoff" color="#918EAF" size="24px" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          {/* Submit */}
          <Button
            variant="contained"
            type="submit"
            disabled={
              loading ||
              !password ||
              !confirmPassword ||
              password !== confirmPassword
            }
          >
            {loading ? "Updating..." : "Reset Password"}
          </Button>
        </Box>
      </Stack>
    </Stack>
  );
}
