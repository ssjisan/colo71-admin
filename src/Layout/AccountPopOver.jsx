import {
  Typography,
  Menu,
  MenuItem,
  Box,
  Divider,
  IconButton,
  Avatar,
} from "@mui/material";
import { useContext, useState } from "react";
import { DataContext } from "../DataProcessing/DataProcessing";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";

export default function AccountPopOver() {
  const [isHovered, setIsHovered] = useState(false);
  const [accountPopOver, setAccountPopOver] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const { auth, setAuth } = useContext(DataContext);
  const navigate = useNavigate();
  console.log("AccountPopOver auth:", auth);
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const handleOpenPopOver = (event) => {
    setAccountPopOver(event.currentTarget);
  };

  const handleClosePopOver = () => {
    setAccountPopOver(null);
  };

  const MenuSx = {
    mt: "32px",
    "& .MuiPaper-root": {
      overflow: "visible",
      borderRadius: "12px",
      filter: "drop-shadow(0px 0px 2px rgba(145, 158, 171, 0.24))",
      mt: 1.5,
      boxShadow: "-20px 20px 40px -4px rgba(145, 158, 171, 0.24)",
      padding: "8px 16px",
    },
    "& .MuiAvatar-root": {
      width: 32,
      height: 32,
      ml: -0.5,
      mr: 1,
    },
  };

  const UserInfoSx = {
    width: "220px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    mb: "16px",
  };

  const AvatarSx = {
    width: "32px",
    height: "32px",
    borderRadius: "100%",
    overflow: "hidden",
    transition: "transform 0.3s ease",
    transform: isHovered ? "scale(1.1)" : "scale(1)",
  };

  const linkStyle = {
    textDecoration: "none",
    fontWeight: 600,
    borderRadius: "4px",
  };

  // Logout

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    handleClosePopOver();

    let logoutSucceeded = false;

    try {
      await API.post("/logout");
      logoutSucceeded = true;
    } catch (error) {
      console.error(
        "Backend logout failed:",
        error.response?.data || error.message,
      );
    } finally {
      setAuth({
        user: null,
        permissions: [],
      });

      localStorage.removeItem("auth");
      sessionStorage.removeItem("auth");

      setLoggingOut(false);
      navigate("/login", { replace: true });

      if (logoutSucceeded) {
        toast.success("Logged out successfully");
      } else {
        toast.error(
          "Logged out locally, but server logout could not be confirmed. Please check your connection.",
        );
      }
    }
  };

  return (
    <>
      <IconButton
        sx={{
          border: "1px solid #dfdfdf",
          width: "40px",
          height: "40px",
          p: "4px !important",
        }}
        onClick={handleOpenPopOver}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="Open account menu"
      >
        <Avatar src="avatar.jpg" sx={AvatarSx} />
      </IconButton>

      <Box>
        <Menu
          sx={MenuSx}
          id="menu-appbar"
          anchorEl={accountPopOver}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          keepMounted
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          open={Boolean(accountPopOver)}
          onClose={handleClosePopOver}
        >
          <Box sx={UserInfoSx}>
            <Typography variant="body2" color="text.primary">
              {auth?.user?.name}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary">
              {auth?.user?.email}
            </Typography>
          </Box>

          <Divider variant="middle" sx={{ borderStyle: "dashed" }} />

          <Link
            to="/change-password"
            style={linkStyle}
            onClick={handleClosePopOver}
          >
            <MenuItem sx={{ mt: "8px" }}>
              <Typography
                color="text.primary"
                sx={{
                  fontSize: "14px",
                  fontWeight: 400,
                }}
              >
                Change Password
              </Typography>
            </MenuItem>
          </Link>

          <MenuItem
            sx={{ mt: "8px" }}
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 400,
                color: "#FF4842",
              }}
            >
              {loggingOut ? "Logging out..." : "Log Out"}
            </Typography>
          </MenuItem>
        </Menu>
      </Box>
    </>
  );
}
