import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { DataContext } from "../../../DataProcessing/DataProcessing";
import { useNavigate } from "react-router-dom";
import API from "../../../api/axios";
import toast from "react-hot-toast";
import Icon from "../../Icon";

export default function InputFields() {
  const forBelow776 = useMediaQuery("(max-width:776px)");

  const {
    showPassword,
    handleClickShowPassword,
    handleMouseDownPassword,
    setAuth,
  } = useContext(DataContext);

  const [lockSeconds, setLockSeconds] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  // Account lock countdown
  useEffect(() => {
    if (lockSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [lockSeconds]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading || lockSeconds > 0) return;

    if (!email.trim() || !password) {
      setErrorMessage("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await API.post("/login", {
        email: email.trim(),
        password,
      });

      const data = response.data;

      // Forced password change
      if (data?.success && data?.code === "PASSWORD_CHANGE_REQUIRED") {
        setAuth({
          user: null,
          permissions: [],
        });

        toast.error(
          data.message || "You must change your password before continuing.",
        );

        navigate("/password-change", { replace: true });
        return;
      }

      // Successful login
      if (data?.success && data?.code === "LOGIN_SUCCESS") {
        setAuth({
          user: data.user || null,
          permissions: data.permissions || [],
        });

        setPassword("");
        toast.success("Login successful");
        navigate("/", { replace: true });
        return;
      }

      setErrorMessage(data?.message || "Login failed. Please try again.");
    } catch (err) {
      const response = err.response;
      const code = response?.data?.code;

      // Account temporarily locked
      if (response?.status === 423 && code === "ACCOUNT_TEMPORARILY_LOCKED") {
        const remainingSeconds = response.data.remainingSeconds || 300;

        setLockSeconds(remainingSeconds);
        setErrorMessage("Account locked. Please try again later.");
        return;
      }

      // Account disabled
      if (response?.status === 403 && code === "ACCOUNT_DISABLED") {
        setErrorMessage(
          response.data.message ||
            "Your account has been disabled. Please contact an administrator.",
        );
        return;
      }

      // Invalid credentials
      if (response?.status === 401 && code === "INVALID_CREDENTIALS") {
        setErrorMessage(response.data.message || "Invalid email or password.");
        return;
      }

      setErrorMessage(
        response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: "420px",
        }}
      >
        <Typography variant="h5">Sign in to your account</Typography>

        <Box
          component="form"
          onSubmit={handleLogin}
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
            {errorMessage && (
              <Stack
                flexDirection="row"
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
                  {errorMessage}
                </Typography>
              </Stack>
            )}

            <TextField
              label="Your Email"
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              fullWidth
              onChange={(e) => setEmail(e.target.value)}
              required
              inputProps={{
                autoComplete: "username",
              }}
            />

            <FormControl variant="outlined" required>
              <InputLabel>Password</InputLabel>

              <OutlinedInput
                type={showPassword ? "text" : "password"}
                value={password}
                name="password"
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                inputProps={{
                  autoComplete: "current-password",
                }}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <Icon name="eyeon" color="#918EAF" size="24px" />
                      ) : (
                        <Icon name="eyeoff" color="#918EAF" size="24px" />
                      )}
                    </IconButton>
                  </InputAdornment>
                }
                label="Password"
              />
            </FormControl>
          </Stack>

          <Stack gap="16px">
            <Typography
              variant="body2"
              onClick={() => navigate("/forgot-password")}
              sx={{
                cursor: "pointer",
                color: "primary.main",
                textDecoration: "none",
                alignSelf: "flex-end",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Forgot Password?
            </Typography>

            <Button
              variant="contained"
              type="submit"
              disabled={loading || lockSeconds > 0}
            >
              {lockSeconds > 0
                ? `Locked (${formatTime(lockSeconds)})`
                : loading
                  ? "Logging in..."
                  : "Login"}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
}
