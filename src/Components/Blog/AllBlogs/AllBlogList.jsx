
import { useCallback, useEffect, useRef, useState, useContext } from "react";
import { Box, Table } from "@mui/material";
import toast from "react-hot-toast";

import axios from "../../../api/axios";
import CustomeHeader from "../../Common/Table/CustomeHeader";
import CustomePagination from "../../Common/Table/CustomePagination";
import ConfirmationModal from "../../Common/RemoveConfirmation/ConfirmationModal";
import Body from "./Body";

import { hasPermission } from "../../../lib/hasPermission";
import { DataContext } from "../../../DataProcessing/DataProcessing";

export default function AllBlogList() {
  const { auth } = useContext(DataContext);

  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [open, setOpen] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const tableRef = useRef(null);
  const [tableWidth, setTableWidth] = useState("auto");

  // Permissions
  const canUpdate = hasPermission(
    auth?.permissions,
    "edit-blog",
    "canUpdate",
  );

  const canDelete = hasPermission(
    auth?.permissions,
    "blogs",
    "canDelete",
  );

  const hasAnyAction = canUpdate || canDelete;

  // Fetch blogs
  const loadBlogs = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await axios.get("/blogs/admin", {
        params: { page: 1, limit: 100 },
      });

      const result = data?.data;

      setBlogs(
        Array.isArray(result)
          ? result
          : result?.blogs || [],
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load blogs.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  // Table width
  useEffect(() => {
    if (tableRef.current) {
      setTableWidth(tableRef.current.scrollWidth);
    }
  }, [blogs, page, rowsPerPage]);

  // Action menu
  const handleOpenMenu = (event, row) => {
    setOpen(event.currentTarget);
    setSelectedRow(row);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  // Delete blog
  const handleRemove = async () => {
    if (!selectedRow?._id) return;

    setLoading(true);

    try {
      await axios.delete(`/blogs/${selectedRow._id}`);

      setBlogs((prev) =>
        prev.filter((item) => item._id !== selectedRow._id),
      );

      toast.success("Blog deleted successfully.");

      setIsModalOpen(false);
      setSelectedRow(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete blog.",
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "title", label: "Title" },
    { key: "published", label: "Published" },
    { key: "featured", label: "Featured" },
    { key: "createdAt", label: "Created at" },
  ];

  const paginatedBlogs = blogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box
      sx={{
        boxShadow:
          "0px 0px 2px rgba(145, 158, 171, 0.2), 0px 12px 24px -4px rgba(145, 158, 171, 0.12)",
        borderRadius: "16px",
        p: 2,
        mt: 3,
      }}
    >
      <Box ref={tableRef} sx={{ overflowX: "auto" }}>
        <Table>
          <CustomeHeader
            columns={columns}
            includeActions={hasAnyAction}
            includeDrag={false}
          />

          <Body
            blogs={paginatedBlogs}
            open={open}
            selectedRow={selectedRow}
            handleOpenMenu={handleOpenMenu}
            handleCloseMenu={handleCloseMenu}
            setIsModalOpen={setIsModalOpen}
            canUpdate={canUpdate}
            canDelete={canDelete}
            hasAnyAction={hasAnyAction}
          />
        </Table>
      </Box>

      {/* Pagination */}
      <Box sx={{ width: tableWidth, overflowX: "auto" }}>
        <CustomePagination
          count={blogs.length}
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
        />
      </Box>

      {/* Delete confirmation */}
      <ConfirmationModal
        open={isModalOpen}
        title="Delete blog"
        itemName={selectedRow?.title}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRow(null);
        }}
        onConfirm={handleRemove}
        loading={loading}
      />
    </Box>
  );
}
