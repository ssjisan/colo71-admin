import { useEffect, useState } from "react";
import API from "../../../api/axios";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import Icon from "../../Icon";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

export default function InputField() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Timers in seconds
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);
  const [resendTimeLeft, setResendTimeLeft] = useState(0);
  const [statusLoading, setStatusLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const resetToken = location.state?.resetToken;
  const email = location.state?.email;

  // -----------------------------------------
  // Check reset token
  // -----------------------------------------

  useEffect(() => {
    if (!resetToken) {
      toast.error("Your password reset session has expired. Please try again.");

      navigate("/forgot-password", {
        replace: true,
      });
    }
  }, [resetToken, navigate]);

  // -----------------------------------------
  // Load timers from backend
  // -----------------------------------------

  useEffect(() => {
    if (!resetToken) return;

    let interval;
    let cancelled = false;

    const loadSessionStatus = async () => {
      setStatusLoading(true);

      try {
        const { data } = await API.post("/forgot-password-status", {
          resetToken,
        });

        if (cancelled || !data.success) return;

        const { otpExpiresAt, resendAvailableAt } = data.data;

        const updateTimers = () => {
          if (cancelled) return;

          const now = Date.now();

          setOtpTimeLeft(
            Math.max(0, Math.ceil((Number(otpExpiresAt) - now) / 1000)),
          );

          setResendTimeLeft(
            Math.max(0, Math.ceil((Number(resendAvailableAt) - now) / 1000)),
          );
        };

        updateTimers();

        interval = setInterval(updateTimers, 1000);
      } catch (error) {
        if (cancelled) return;

        const errorData = error.response?.data;

        if (errorData?.sessionExpired) {
          toast.error(
            "Your password reset session has expired. Please request a new OTP.",
          );

          navigate("/forgot-password", {
            replace: true,
          });
        } else if (errorData?.code === "OTP_ALREADY_VERIFIED") {
          toast.error("OTP has already been verified.");

          navigate("/forgot-password", {
            replace: true,
          });
        } else {
          setMessage(
            errorData?.message ||
              "Unable to check your OTP session. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setStatusLoading(false);
        }
      }
    };

    loadSessionStatus();

    return () => {
      cancelled = true;

      if (interval) {
        clearInterval(interval);
      }
    };
  }, [resetToken, navigate]);

  // -----------------------------------------
  // VERIFY OTP
  // -----------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!resetToken) {
      toast.error("Your password reset session has expired.");

      navigate("/forgot-password", {
        replace: true,
      });

      return;
    }

    if (!otp.trim()) {
      setMessage("Please enter the OTP.");
      return;
    }

    if (otp.trim().length !== 6) {
      setMessage("Please enter the 6-digit OTP.");
      return;
    }

    if (otpTimeLeft <= 0) {
      setMessage("This OTP has expired. Please request a new OTP.");
      return;
    }

    setLoading(true);

    const toastId = toast.loading("Verifying OTP...");

    try {
      const { data } = await API.post("/verify-forgot-password-otp", {
        resetToken,
        otp: otp.trim(),
      });

      toast.dismiss(toastId);

      if (data.success) {
        toast.success("OTP verified successfully");

        navigate("/reset-password", {
          state: {
            resetToken: data.data?.resetToken || resetToken,
          },
        });

        return;
      }

      setMessage(data.message || "Invalid OTP.");
    } catch (error) {
      toast.dismiss(toastId);

      const errorData = error.response?.data;

      setMessage(
        errorData?.message || "Verification failed. Please try again.",
      );

      if (errorData?.sessionExpired) {
        navigate("/forgot-password", {
          replace: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // RESEND OTP
  // -----------------------------------------

  const handleResend = async () => {
    if (!email) {
      toast.error("Your email information is missing. Please start again.");

      navigate("/forgot-password", {
        replace: true,
      });

      return;
    }

    if (resendTimeLeft > 0) {
      setMessage(
        `Please wait ${resendTimeLeft} seconds before requesting another OTP.`,
      );

      return;
    }

    setResendLoading(true);
    setMessage("");

    const toastId = toast.loading("Sending new OTP...");

    try {
      const { data } = await API.post("/resend-forgot-password-otp", { email });

      toast.dismiss(toastId);

      if (data.success) {
        const newResetToken = data.data?.resetToken;

        if (!newResetToken) {
          setMessage(
            "The server did not return a new reset session. Please try again.",
          );
          return;
        }

        toast.success("A new OTP has been sent to your email.");

        // The new token triggers a fresh backend status check.
        navigate("/verify-otp", {
          replace: true,
          state: {
            email,
            resetToken: newResetToken,
          },
        });

        setOtp("");
        setMessage("");
        return;
      }

      setMessage(data.message || "Failed to send a new OTP.");
    } catch (error) {
      toast.dismiss(toastId);

      const errorData = error.response?.data;

      if (errorData?.code === "OTP_RESEND_COOLDOWN") {
        const retryAfter = Number(errorData?.data?.retryAfter);

        if (Number.isFinite(retryAfter) && retryAfter >= 0) {
          setResendTimeLeft(retryAfter);
        }

        setMessage(
          errorData?.message || "Please wait before requesting another OTP.",
        );
      } else if (errorData?.sessionExpired) {
        toast.error("Your reset session has expired.");

        navigate("/forgot-password", {
          replace: true,
        });
      } else {
        setMessage(
          errorData?.message || "Failed to resend OTP. Please try again.",
        );
      }
    } finally {
      setResendLoading(false);
    }
  };

  // -----------------------------------------
  // Format timers
  // -----------------------------------------

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  // -----------------------------------------
  // UI
  // -----------------------------------------

  return (
    <Stack
      sx={{
        px: 4,
        height: "100%",
        minHeight: {
          xs: "80vh",
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
        <Typography variant="h5">Verify OTP</Typography>

        <Typography variant="body2" color="text.secondary">
          We&apos;ve sent a 6-digit verification code to{" "}
          <strong>{email || "your email address"}</strong>. Enter the code below
          to continue.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            mt: 4,
          }}
        >
          {/* ERROR MESSAGE */}

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

          {/* OTP INPUT */}

          <TextField
            label="OTP"
            type="text"
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);

              setOtp(value);
              setMessage("");
            }}
            fullWidth
            required
            autoComplete="one-time-code"
            inputProps={{
              maxLength: 6,
              inputMode: "numeric",
            }}
          />

          {/* OTP EXPIRY */}

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body2" color="text.secondary">
              OTP expires in
            </Typography>

            <Typography
              variant="body2"
              color={otpTimeLeft <= 60 ? "error.main" : "text.secondary"}
              fontWeight={600}
            >
              {statusLoading
                ? "Checking..."
                : otpTimeLeft > 0
                  ? formatTime(otpTimeLeft)
                  : "Expired"}
            </Typography>
          </Stack>

          {/* VERIFY BUTTON */}

          <Button
            type="submit"
            variant="contained"
            disabled={
              loading || statusLoading || otp.length !== 6 || otpTimeLeft === 0
            }
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          {/* RESEND SECTION */}

          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            gap={1}
            flexWrap="wrap"
          >
            <Typography>Didn&apos;t receive the code?</Typography>

            {statusLoading || resendTimeLeft > 0 ? (
              <Typography color="text.secondary" fontWeight={500}>
                {statusLoading
                  ? "Checking..."
                  : `Request again in ${formatTime(resendTimeLeft)}`}
              </Typography>
            ) : (
              <Typography
                component="button"
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                sx={{
                  border: 0,
                  padding: 0,
                  background: "transparent",
                  font: "inherit",
                  fontWeight: 600,
                  cursor: resendLoading ? "not-allowed" : "pointer",
                  color: "primary.main",
                  opacity: resendLoading ? 0.6 : 1,
                }}
              >
                {resendLoading ? "Sending..." : "Request again"}
              </Typography>
            )}
          </Stack>

          {/* BACK BUTTON */}

          <Button
            variant="text"
            startIcon={<Icon name="arrowleft" size="20px" color="#792DF8" />}
            onClick={() => navigate("/forgot-password")}
          >
            Back
          </Button>
        </Box>
      </Stack>
    </Stack>
  );
}
