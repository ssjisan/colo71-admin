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

export default function AllCaseStudyList() {
  const { auth } = useContext(DataContext);
  const [caseStudies, setCaseStudies] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [open, setOpen] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const tableRef = useRef(null);
  const [tableWidth, setTableWidth] = useState("auto");

  const canUpdate = hasPermission(auth?.permissions, "edit-case-study", "canUpdate");
  const canDelete = hasPermission(auth?.permissions, "case-studies", "canDelete");
  const hasAnyAction = canUpdate || canDelete;

  const loadCaseStudies = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/case-studies/admin", { params: { page: 1, limit: 100 } });
      const result = data?.data;
      setCaseStudies(Array.isArray(result) ? result : result?.caseStudies || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load case studies.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCaseStudies(); }, [loadCaseStudies]);
  useEffect(() => { if (tableRef.current) setTableWidth(tableRef.current.scrollWidth); }, [caseStudies, page, rowsPerPage]);

  const handleOpenMenu = (event, row) => { setOpen(event.currentTarget); setSelectedRow(row); };
  const handleCloseMenu = () => setOpen(null);
  const handleRemove = async () => {
    if (!selectedRow?._id) return;
    setLoading(true);
    try {
      await axios.delete(`/case-studies/${selectedRow._id}`);
      setCaseStudies((prev) => prev.filter((item) => item._id !== selectedRow._id));
      toast.success("Case study deleted successfully.");
      setIsModalOpen(false); setSelectedRow(null);
    } catch (error) { toast.error(error.response?.data?.message || "Failed to delete case study."); }
    finally { setLoading(false); }
  };

  const columns = [
    { key: "title", label: "Title" },
    { key: "industry", label: "Industry" },
    { key: "projectType", label: "Project type" },
    { key: "published", label: "Published" },
    { key: "featured", label: "Featured" },
    { key: "createdAt", label: "Created at" },
  ];
  const paginatedItems = caseStudies.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return <Box sx={{ boxShadow: "0px 0px 2px rgba(145, 158, 171, 0.2), 0px 12px 24px -4px rgba(145, 158, 171, 0.12)", borderRadius: "16px", p: 2, mt: 3 }}>
    <Box ref={tableRef} sx={{ overflowX: "auto" }}>
      <Table><CustomeHeader columns={columns} includeActions={hasAnyAction} includeDrag={false} />
        <Body caseStudies={paginatedItems} open={open} selectedRow={selectedRow} handleOpenMenu={handleOpenMenu} handleCloseMenu={handleCloseMenu} setIsModalOpen={setIsModalOpen} canUpdate={canUpdate} canDelete={canDelete} hasAnyAction={hasAnyAction} loading={loading} />
      </Table>
    </Box>
    <Box sx={{ width: tableWidth, overflowX: "auto" }}><CustomePagination count={caseStudies.length} page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} /></Box>
    <ConfirmationModal open={isModalOpen} title="Delete case study" itemName={selectedRow?.title} onClose={() => { setIsModalOpen(false); setSelectedRow(null); }} onConfirm={handleRemove} loading={loading} />
  </Box>;
}
