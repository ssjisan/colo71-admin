import { Box, Stack, Typography } from "@mui/material";
import PasswordChangeFields from "../Components/UserAuth/Login/PasswordChangeFields";
import { Logo } from "../assets/Logo";

export default function ResetPassword() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "grid",

        gridTemplateColumns: {
          xs: "1fr",
          md: "minmax(0, 1fr) minmax(0, 2fr)",
        },
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          position: "fixed",
          top: {
            xs: "16px",
            md: "24px",
          },
          left: {
            xs: "16px",
            md: "24px",
          },
          zIndex: 10,
        }}
      >
        <Logo width="48px" height="48px" />
      </Box>

      {/* LEFT SIDE */}
      <Box
        sx={{
          display: {
            xs: "none",
            md: "flex",
          },

          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",

          minHeight: "100vh",

          backgroundColor: "#F3F3F3",

          px: {
            md: "32px",
            lg: "48px",
          },

          pt: {
            md: "120px",
            lg: "140px",
          },

          pb: {
            md: "48px",
            lg: "64px",
          },

          boxSizing: "border-box",
        }}
      >
        {/* Welcome text */}
        <Stack spacing={0.5} alignItems="center" textAlign="center">
          <Typography
            sx={{
              fontSize: {
                md: "32px",
                lg: "36px",
              },
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#111827",
            }}
          >
            Hi! Welcome back
          </Typography>

          <Typography
            sx={{
              fontSize: {
                md: "15px",
                lg: "17px",
              },
              color: "#64748B",
            }}
          >
            Smarter workflows for better efficiency.
          </Typography>
        </Stack>

        {/* Graphic */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box
            component="img"
            src="image.png"
            alt=""
            sx={{
              width: {
                md: "75%",
                lg: "80%",
              },
              maxWidth: "420px",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </Box>
      </Box>

      {/* RIGHT SIDE */}
      <Box
        sx={{
          minWidth: 0,
          minHeight: "100vh",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          px: {
            xs: "20px",
            sm: "32px",
            md: "48px",
            lg: "64px",
            xl: "80px",
          },

          py: {
            xs: "96px",
            md: "48px",
          },

          boxSizing: "border-box",
        }}
      >
        <PasswordChangeFields />
      </Box>
    </Box>
  );
}
