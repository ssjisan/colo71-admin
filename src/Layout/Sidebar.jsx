import { useContext, useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import api from "../api/axios";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";

import PropTypes from "prop-types";

import { Logo } from "../assets/Logo";
import Icon from "../Components/Icon";
import { DataContext } from "../DataProcessing/DataProcessing";

const drawerWidth = 260;

function Sidebar(props) {
  const { window } = props;
  const { pathname } = useLocation();
  const { auth } = useContext(DataContext);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pages, setPages] = useState([]);

  // -----------------------------------------
  // Permission check
  // -----------------------------------------
  const canView = (slug) => {
    // Root user can see everything
    if (auth?.role?.isRoot === true) {
      return true;
    }

    const permission = auth?.permissions?.find(
      (item) => item.page?.slug === slug,
    );

    return permission?.canView === true;
  };
  console.log("AUTH:", auth);
  console.log("PERMISSIONS:", auth?.permissions);
  // -----------------------------------------
  // Mobile drawer
  // -----------------------------------------
  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  // -----------------------------------------
  // Accordion
  // -----------------------------------------
  const handleAccordionChange = (section) => (event, isExpanded) => {
    setExpanded(isExpanded ? section.name : false);
  };

  // -----------------------------------------
  // Fetch pages
  // -----------------------------------------
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await api.get("/pages");

        setPages(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Error fetching pages:", error);
        setPages([]);
      }
    };

    fetchPages();
  }, []);

  // -----------------------------------------
  // Close mobile drawer after navigation
  // -----------------------------------------
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // -----------------------------------------
  // Render sidebar
  // -----------------------------------------
  const drawer = (
    <Box
      className="sidebar"
      sx={{
        height: "100%",
        overflowY: "auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          p: "16px",
        }}
      >
        {/* Logo */}
        <Box sx={{ ml: "24px" }}>
          <Logo width="56px" height="56px" />
        </Box>

        <List sx={{ p: 0 }}>
          {pages.map((section) => {
            const children = section.children || [];

            // -----------------------------------------
            // Filter visible children
            // -----------------------------------------
            const visibleChildren = children.filter(
              (item) => item.isMenu && canView(item.slug),
            );

            // -----------------------------------------
            // Section visibility
            //
            // Show parent when:
            // 1. User can view parent
            // OR
            // 2. At least one child is visible
            // -----------------------------------------
            const canViewSection = canView(section.slug);

            if (!canViewSection && visibleChildren.length === 0) {
              return null;
            }

            // -----------------------------------------
            // Section active state
            // -----------------------------------------
            const isSectionActive =
              pathname === section.path ||
              visibleChildren.some((item) => pathname.startsWith(item.path));

            // -----------------------------------------
            // No children
            // -----------------------------------------
            if (children.length === 0) {
              if (!canViewSection) {
                return null;
              }

              const active = pathname === section.path;

              return (
                <ListItem
                  disablePadding
                  key={section._id}
                  sx={{
                    mb: "8px",
                  }}
                >
                  <ListItemButton
                    component={Link}
                    to={section.path}
                    sx={{
                      display: "flex",
                      justifyContent: "flex-start",
                      borderRadius: "8px",
                      width: "100%",
                      px: "16px",
                      py: "8px",
                      height: "44px",

                      backgroundColor: active
                        ? "rgba(239, 229, 255, 1)"
                        : "transparent",

                      color: active ? "#792df8" : "#637381",

                      "&:hover": {
                        backgroundColor: active
                          ? "rgba(239, 229, 255, 1)"
                          : "rgba(99, 115, 129, 0.08)",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: "36px",
                      }}
                    >
                      <Icon
                        name={section.icon || "dashboard"}
                        size={20}
                        color={active ? "#792df8" : "#637381"}
                      />
                    </ListItemIcon>

                    <Typography
                      sx={{
                        fontWeight: active ? 600 : 500,
                        fontSize: "14px",
                        color: "inherit",
                      }}
                    >
                      {section.name}
                    </Typography>
                  </ListItemButton>
                </ListItem>
              );
            }

            // -----------------------------------------
            // Parent with children
            // -----------------------------------------
            return (
              <Accordion
                key={section._id}
                square={false}
                expanded={expanded === section.name || isSectionActive}
                onChange={handleAccordionChange(section)}
                sx={{
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "transparent",
                  boxShadow: "none",
                  margin: "0 0 8px 0",

                  "&::before": {
                    display: "none",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <Icon name="arrowdown" color="#637381" size={16} />
                  }
                  sx={{
                    minHeight: "44px",
                    height: "44px",
                    px: "16px",

                    backgroundColor: isSectionActive
                      ? "rgba(239, 229, 255, 1)"
                      : "transparent",

                    borderRadius: "8px",

                    "&.Mui-expanded": {
                      minHeight: "44px",
                    },

                    "& .MuiAccordionSummary-content": {
                      margin: 0,
                      padding: 0,
                      alignItems: "center",
                    },

                    "& .MuiAccordionSummary-content.Mui-expanded": {
                      margin: 0,
                    },

                    "& .MuiAccordionSummary-expandIconWrapper": {
                      transition: "transform 0.2s ease",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: "36px",
                    }}
                  >
                    <Icon
                      name={section.icon || "dashboard"}
                      size={20}
                      color={isSectionActive ? "#792df8" : "#637381"}
                    />
                  </ListItemIcon>

                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: isSectionActive ? 600 : 500,
                      color: isSectionActive ? "#792df8" : "#637381",
                    }}
                  >
                    {section.name}
                  </Typography>
                </AccordionSummary>

                <AccordionDetails
                  sx={{
                    p: "8px 0 0 16px",
                  }}
                >
                  {visibleChildren.map((item) => {
                    const active = pathname === item.path;

                    return (
                      <ListItem
                        disablePadding
                        key={item._id}
                        sx={{
                          borderRadius: "8px",
                          mb: "4px",
                        }}
                      >
                        <ListItemButton
                          component={Link}
                          to={item.path}
                          sx={{
                            px: "16px",
                            py: "8px",
                            minHeight: "36px",
                            color: active ? "#060415" : "#637381",

                            backgroundColor: active
                              ? "rgba(6, 4, 21, 0.04)"
                              : "transparent",

                            borderRadius: "8px",

                            "&:hover": {
                              backgroundColor: active
                                ? "rgba(6, 4, 21, 0.04)"
                                : "rgba(99, 115, 129, 0.06)",
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: "24px",
                            }}
                          >
                            <Icon
                              name="bullet"
                              color={active ? "#060415" : "#637381"}
                              size={active ? 12 : 10}
                            />
                          </ListItemIcon>

                          <Typography
                            sx={{
                              fontWeight: active ? 600 : 500,
                              fontSize: "14px",
                              color: "inherit",
                            }}
                          >
                            {item.name}
                          </Typography>
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </List>
      </Box>
    </Box>
  );

  const container =
    window !== undefined ? () => window().document.body : undefined;

  return (
    <Box
      component="nav"
      sx={{
        width: {
          lg: drawerWidth,
        },
        flexShrink: {
          lg: 0,
        },
      }}
    >
      {/* Mobile */}
      <Drawer
        container={container}
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: {
            xs: "block",
            lg: "none",
          },

          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            background: "#F9FAFB",
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: {
            xs: "none",
            lg: "block",
          },

          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            background: "#F9FAFB",
            borderRightStyle: "dashed",
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
}

Sidebar.propTypes = {
  window: PropTypes.func,
};

export default Sidebar;
