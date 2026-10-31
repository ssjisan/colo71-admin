import { Box, Stack, Typography, useMediaQuery } from "@mui/material";
import { DataContext } from "../../../DataProcessing/DataProcessing";
import { useContext, useEffect, useState } from "react";

export default function WelcomeCard() {
  const forBelow676 = useMediaQuery("(max-width:676px)");
  const { auth } = useContext(DataContext);

  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexDirection: forBelow676 ? "column" : "row",
        background: "url(bg.png)",
        borderRadius: "16px",
        height: "100%",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
      }}
    >
      <Box
        sx={{
          p: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          alignItems: "flex-start",
        }}
      >
        <Stack gap="8px">
          {/* Current Date & Time */}
          <Typography
            sx={{
              fontSize: "14px",
              color: "text.secondary",
            }}
          >
            {formattedDate}
          </Typography>

          <Typography variant="h4" sx={{ width: "100%" }} color="text.primary">
            Welcome back <br /> {auth?.user?.name}!
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Everything you need is organized here — explore, manage, and stay
            updated.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
