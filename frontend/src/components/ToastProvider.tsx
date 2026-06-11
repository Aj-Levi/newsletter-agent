"use client";
import React, { ReactNode } from "react";
import { ToastContainer } from "react-toastify";

const ToastProvider = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <ToastContainer />
      <>{children}</>
    </>
  );
};

export default ToastProvider;
