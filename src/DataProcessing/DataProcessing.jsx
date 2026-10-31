import { createContext } from "react";
import PropTypes from "prop-types";
import LoginForm from "./Components/LoginForm";
import AuthProvider from "./Components/AuthProvider";

export const DataContext = createContext();

export default function DataProcessing({ children }) {
  // -----------------------------------------------Login Controller Start--------------------------------------------------- //
  const {
    showPassword,
    handleClickShowPassword,
    handleMouseDownPassword,
    handleLogin,
    isUserLoggedIn,
    setIsUserLoggedIn,
    handleLoginDetails,
    loginDetails,
  } = LoginForm();

  // -----------------------------------------------Login Controller End----------------------------------------------------- //

  // ----------------------------------------------- Video Controller Start --------------------------------------------- //

  // -----------------------------------------------Auth Provider Start--------------------------------------------------- //
  const { auth, setAuth, loading } = AuthProvider();
  // -----------------------------------------------Auth Provider End--------------------------------------------------- //

  return (
    <DataContext.Provider
      value={{
        // Auth Provider
        auth,
        setAuth,
        loading,
        //Login Form Data Pass
        showPassword,
        handleClickShowPassword,
        handleMouseDownPassword,
        handleLogin,
        isUserLoggedIn,
        setIsUserLoggedIn,
        handleLoginDetails,
        loginDetails,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
// Prop types validation
DataProcessing.propTypes = {
  children: PropTypes.node.isRequired,
};
