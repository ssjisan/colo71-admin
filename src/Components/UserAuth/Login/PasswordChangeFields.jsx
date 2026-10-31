import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import PropTypes from "prop-types";
import { useState } from "react";
import Icon from "../../Icon";

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../../../api/axios";

export default function PasswordChangeFields() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const passwordRequirements = {
    minLength: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    specialCharacter: /[^A-Za-z\d]/.test(newPassword),
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setErrorMessage("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      await API.post("/change-password", {
        newPassword,
        confirmPassword,
      });

      toast.success("Password changed successfully");

      navigate("/login");
    } catch (err) {
      const code = err.response?.data?.code;
      const message = err.response?.data?.message || "Something went wrong";

      if (
        code === "PASSWORD_CHANGE_SESSION_EXPIRED" ||
        code === "INVALID_PASSWORD_CHANGE_TOKEN"
      ) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const Requirement = ({ matched, children }) => (
    <Stack
      direction="row"
      alignItems="center"
      gap="8px"
      sx={{
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: matched ? "#22C55E" : "#E5E7EB",
          transition: "all 0.2s ease",
        }}
      >
        {matched && (
          <Typography
            component="span"
            sx={{
              color: "#fff",
              fontSize: "12px",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            ✓
          </Typography>
        )}
      </Box>

      <Typography
        sx={{
          minWidth: 0,
          fontSize: {
            xs: "12px",
            sm: "13px",
          },
          lineHeight: 1.5,
          color: matched ? "#22C55E" : "#918EAF",
          transition: "color 0.2s ease",
        }}
      >
        {children}
      </Typography>
    </Stack>
  );

  Requirement.propTypes = {
    matched: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
  };

  return (
    <Box
      component="form"
      onSubmit={handleChangePassword}
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "920px",
          px: {
            xs: "16px",
            sm: "24px",
            md: "32px",
          },
        }}
      >
        {/* Error */}
        {errorMessage && (
          <Stack
            direction="row"
            alignItems="center"
            sx={{
              width: "100%",
              background: "#FFE9D5",
              p: {
                xs: "8px 12px",
                sm: "8px 16px",
              },
              borderRadius: "12px",
              minHeight: "48px",
              mb: {
                xs: "24px",
                md: "32px",
              },
            }}
          >
            <Icon name="alert" color="#FF5630" size="24px" />

            <Typography
              variant="body2"
              sx={{
                color: "#FF5630",
                ml: 1,
                fontSize: {
                  xs: "13px",
                  sm: "14px",
                },
              }}
            >
              {errorMessage}
            </Typography>
          </Stack>
        )}

        {/* Main Content */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 1fr) minmax(0, 1fr)",
            },
            gap: {
              xs: "28px",
              sm: "36px",
              md: "56px",
            },
            alignItems: "start",
          }}
        >
          {/* LEFT — Requirements */}
          <Box
            sx={{
              order: {
                xs: 2,
                md: 1,
              },

              width: "100%",

              // Remove the large visual box from the original layout
              backgroundColor: "transparent",

              p: 0,

              display: "flex",
              flexDirection: "column",
              justifyContent: "center",

              minHeight: {
                md: "240px",
              },
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: "14px",
                  sm: "15px",
                  md: "16px",
                },
                fontWeight: 600,
                color: "#333333",
                mb: {
                  xs: "16px",
                  md: "18px",
                },
              }}
            >
              Password must contain:
            </Typography>

            <Stack gap="12px">
              <Requirement matched={passwordRequirements.minLength}>
                At least 8 characters
              </Requirement>

              <Requirement matched={passwordRequirements.uppercase}>
                At least one uppercase letter
              </Requirement>

              <Requirement matched={passwordRequirements.lowercase}>
                At least one lowercase letter
              </Requirement>

              <Requirement matched={passwordRequirements.number}>
                At least one number
              </Requirement>

              <Requirement matched={passwordRequirements.specialCharacter}>
                At least one special character
              </Requirement>
            </Stack>
          </Box>

          {/* RIGHT — Form */}
          <Stack
            gap={{
              xs: "18px",
              sm: "22px",
              md: "28px",
            }}
            sx={{
              order: {
                xs: 1,
                md: 2,
              },

              width: "100%",
            }}
          >
            {/* New Password */}
            <FormControl variant="outlined" required fullWidth>
              <InputLabel>New Password</InputLabel>

              <OutlinedInput
                fullWidth
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                label="New Password"
                sx={{
                  minHeight: {
                    xs: "52px",
                    sm: "56px",
                  },
                }}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? (
                        <Icon name="eyeon" color="#918EAF" size="24px" />
                      ) : (
                        <Icon name="eyeoff" color="#918EAF" size="24px" />
                      )}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>

            {/* Confirm Password */}
            <FormControl variant="outlined" required fullWidth>
              <InputLabel>Confirm New Password</InputLabel>

              <OutlinedInput
                fullWidth
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                label="Confirm New Password"
                sx={{
                  minHeight: {
                    xs: "52px",
                    sm: "56px",
                  },
                }}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                    >
                      {showConfirmPassword ? (
                        <Icon name="eyeon" color="#918EAF" size="24px" />
                      ) : (
                        <Icon name="eyeoff" color="#918EAF" size="24px" />
                      )}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>

            {/* Submit */}
            <Button
              variant="contained"
              type="submit"
              disabled={
                loading ||
                !Object.values(passwordRequirements).every(Boolean) ||
                newPassword !== confirmPassword
              }
              fullWidth
              sx={{
                minHeight: {
                  xs: "50px",
                  sm: "54px",
                },

                mt: {
                  xs: "0px",
                  sm: "4px",
                },

                borderRadius: "8px",
              }}
            >
              {loading ? "Changing..." : "Change Password"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
