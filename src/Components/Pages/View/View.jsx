import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import CustomeHeader from "../../Common/Table/CustomeHeader";
import CustomChip from "../../Common/Chip/CustomeChip";
import Icon from "../../Icon";
import CustomePopOver from "../../Common/PopOver/CustomePopOver";
import { hasPermission } from "../../../lib/hasPermission";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../../api/axios";
import { DataContext } from "../../../DataProcessing/DataProcessing";
import ConfirmationModal from "../../Common/RemoveConfirmation/ConfirmationModal";

export default function View() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);

  const { auth } = useContext(DataContext);

  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);

  const navigate = useNavigate();

  // --------------------------------
  // Permissions
  // --------------------------------
  const canUpdate = hasPermission(auth?.permissions, "pages", "canUpdate");

  const canDelete = hasPermission(auth?.permissions, "pages", "canDelete");

  const hasAnyAction = canUpdate || canDelete;

  // --------------------------------
  // Flatten page tree
  // --------------------------------
  const flattenPages = (data, level = 0, parentOrder = "") => {
    let result = [];

    data.forEach((item, index) => {
      const orderPrefix = parentOrder
        ? `${parentOrder}.${index + 1}`
        : `${index + 1}`;

      result.push({
        ...item,
        level,
        displayOrder: orderPrefix,
      });

      if (item.children?.length) {
        result = result.concat(
          flattenPages(item.children, level + 1, orderPrefix),
        );
      }
    });

    return result;
  };

  // --------------------------------
  // Fetch pages
  // --------------------------------
  const fetchPages = async () => {
    try {
      setLoading(true);

      const res = await axios.get("/pages");

      const flat = flattenPages(res.data || []);

      setPages(flat);
    } catch (error) {
      console.error("Failed to fetch pages:", error);

      toast.error(error?.response?.data?.message || "Failed to load pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  // --------------------------------
  // Delete page
  // --------------------------------
  const handleDelete = async () => {
    if (!deleteItem?._id) {
      toast.error("Page not found");
      return;
    }

    try {
      const { data } = await axios.delete(`/pages/${deleteItem._id}`);

      toast.success(data?.message || "Page deleted successfully");

      await fetchPages();
    } catch (err) {
      console.error("Delete page error:", err);

      toast.error(err?.response?.data?.message || "Failed to delete page");
    } finally {
      setOpenConfirm(false);
      setDeleteItem(null);
    }
  };

  // --------------------------------
  // Popover
  // --------------------------------
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event, page) => {
    setAnchorEl(event.currentTarget);
    setSelectedPage(page);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedPage(null);
  };

  // --------------------------------
  // Table columns
  // --------------------------------
  const columns = [
    {
      key: "order",
      label: "Order",
    },
    {
      key: "name",
      label: "Name",
    },
    {
      key: "slug",
      label: "Slug",
    },
    {
      key: "path",
      label: "Path",
    },
    {
      key: "menu",
      label: "Menu",
      align: "center",
    },
    {
      key: "status",
      label: "Status",
      align: "center",
    },
  ];

  // --------------------------------
  // Action menu
  // --------------------------------
  const menuItems = [
    {
      label: "Edit",
      iconName: "Edit",
      onClick: () => {
        navigate(`/page-settings/${selectedPage?._id}`);
        handleCloseMenu();
      },
      color: "#838383",
      hide: !canUpdate,
    },
    {
      label: "Delete",
      iconName: "Delete",
      onClick: () => {
        setDeleteItem(selectedPage);
        setOpenConfirm(true);
        handleCloseMenu();
      },
      color: "error",
      hide: !canDelete,
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          boxShadow:
            "0px 0px 2px rgba(145, 158, 171, 0.2), 0px 12px 24px -4px rgba(145, 158, 171, 0.12)",
          borderRadius: "16px",
          p: 2,
          mt: 3,
          mb: 3,
        }}
      >
        <TableContainer>
          <Table>
            <CustomeHeader columns={columns} includeActions={hasAnyAction} />

            <TableBody>
              {/* Loading */}
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (hasAnyAction ? 1 : 0)}
                    align="center"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : pages.length > 0 ? (
                pages.map((page) => (
                  <TableRow key={page._id}>
                    {/* Order */}
                    <TableCell>{page.displayOrder}</TableCell>

                    {/* Name */}
                    <TableCell>
                      <Box
                        sx={{
                          pl: page.level * 3,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {page.level > 0 && (
                          <Box
                            component="span"
                            sx={{
                              mr: 0.5,
                              color: "#919EAB",
                            }}
                          >
                            └──
                          </Box>
                        )}

                        {page.name}
                      </Box>
                    </TableCell>

                    {/* Slug */}
                    <TableCell>{page.slug}</TableCell>

                    {/* Path */}
                    <TableCell>{page.path}</TableCell>

                    {/* Menu */}
                    <TableCell align="center">
                      <CustomChip
                        label={page.isMenu ? "Yes" : "No"}
                        type={page.isMenu ? "info" : "warning"}
                      />
                    </TableCell>

                    {/* Status */}
                    <TableCell align="center">
                      <CustomChip
                        label={page.isActive ? "Active" : "Inactive"}
                        type={page.isActive ? "success" : "error"}
                      />
                    </TableCell>

                    {/* Actions */}
                    {hasAnyAction && (
                      <TableCell align="center">
                        <IconButton onClick={(e) => handleOpenMenu(e, page)}>
                          <Icon name="More" size={20} color="#919EAB" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (hasAnyAction ? 1 : 0)}
                    align="center"
                  >
                    No pages found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Action Popover */}
      <CustomePopOver
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseMenu}
        menuItems={menuItems}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        open={openConfirm}
        title="Delete Page"
        itemName={deleteItem?.name}
        onClose={() => {
          setOpenConfirm(false);
          setDeleteItem(null);
        }}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
