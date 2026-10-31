import { useContext } from "react";
import { DataContext } from "../DataProcessing/DataProcessing";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Dashboard from "../Page/Dashboard";
import PrivateRoute from "./PrivateRoute";
import Login from "../UserAuth/Login";
import PasswordChange from "../UserAuth/PasswordChange";
import Loading from "./Loading";
import MainLayout from "./MainLayout";
import Pages from "../Page/Pages/Pages";
import PageSettings from "../Page/Pages/PageSettings";
import Roles from "../Page/Roles/Roles";
import RoleSettings from "../Page/Roles/RoleSettings";
import Users from "../Page/Users/Users";
import UserSettings from "../Page/Users/UserSettings";
import PermissionRoute from "./PermissionRoute";
import Backup from "../Page/Backup";
import ChangePasswordForm from "../Components/User/ChangePasswordForm";
import ForgotPassword from "../UserAuth/ForgotPassword";
import VerifiyOtp from "../UserAuth/VerifiyOtp";
import ResetPassword from "../UserAuth/ResetPassword";
import ScheduleManagement from "../Page/ScheduleManagement/ScheduleManagement";
import FacilityVisitRequests from "../Page/ScheduleManagement/FacilityVisitRequests";
import AddAlbum from "../Page/Album/AddAlbum";
import AlbumList from "../Page/Album/AlbumList";
import AlbumEdit from "../Page/Album/AlbumEdit";
import BlogPreview from "../Components/Blog/BlogPreview";
import BlogCreate from "../Page/Blog/BlogCreate";
import BlogEdit from "../Page/Blog/BlogEdit";
import BlogList from "../Page/Blog/BlogList";
import CaseStudyCreate from "../Page/CaseStudy/CaseStudyCreate";
import CaseStudyEdit from "../Page/CaseStudy/CaseStudyEdit";
import CaseStudyList from "../Page/CaseStudy/CaseStudyList";
import CaseStudyPreviewPage from "../Page/CaseStudy/CaseStudyPreviewPage";

export default function MainRouters() {
  const { loading } = useContext(DataContext);

  // BLOCK rendering until auth is hydrated
  if (loading) return <Loading />;

  return (
    <>
      <Toaster
        toastOptions={{
          success: {
            style: {
              background: "#59B259",
              color: "#fff",
            },
          },
          error: {
            style: {
              background: "#EC4034",
              color: "#fff",
            },
          },
        }}
      />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/password-change" element={<PasswordChange />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifiyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/change-password" element={<ChangePasswordForm />} />

            <Route element={<PermissionRoute />}>
              {/* Dashbaord */}
              <Route path="/" element={<Dashboard />} />
              {/* Pages */}
              <Route path="/pages" element={<Pages />} />
              <Route path="/page-settings" element={<PageSettings />} />
              <Route path="/page-settings/:id" element={<PageSettings />} />
              {/* Roles */}
              <Route path="/roles" element={<Roles />} />
              <Route path="/role-settings" element={<RoleSettings />} />
              <Route path="/role-settings/:id" element={<RoleSettings />} />
              {/* Users */}
              <Route path="/users" element={<Users />} />
              <Route path="/user-settings" element={<UserSettings />} />
              <Route path="/user-settings/:id" element={<UserSettings />} />
              {/* Backup */}
              <Route path="/backup" element={<Backup />} />

              {/* Blogs */}
              <Route path="/create-blog" element={<BlogCreate />} />
              <Route path="/edit-blog/:id" element={<BlogEdit />} />
              <Route path="/blogs" element={<BlogList />} />
              <Route path="/blog-preview/:id" element={<BlogPreview />} />

              {/* Case Study */}
              <Route path="/create-case-study" element={<CaseStudyCreate />} />
              <Route path="/edit-case-study/:id" element={<CaseStudyEdit />} />
              <Route path="/case-studies" element={<CaseStudyList />} />
              <Route
                path="/case-study-preview/:id"
                element={<CaseStudyPreviewPage />}
              />

              {/* Schedule */}
              <Route
                path="/schedule-management"
                element={<ScheduleManagement />}
              />
              <Route
                path="/requested-schedule"
                element={<FacilityVisitRequests />}
              />
              {/* Albums/Gallery */}
              <Route path="/add-album" element={<AddAlbum />} />
              <Route path="/edit-album/:id" element={<AlbumEdit />} />
              <Route path="/album-list" element={<AlbumList />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
}
