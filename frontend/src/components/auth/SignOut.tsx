"use client";

import ToastStyles from "@/styles/ToastStyles";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { toast } from "react-toastify";

const SignOut = () => {
    const router = useRouter();
    const handleSignOut = async() => {
        try {
            toast.info("signing out please wait",ToastStyles);
            await signOut({ redirect: false });
            toast.success("Logged out successfully", ToastStyles);
            setTimeout(() => {
              router.replace("/home");
              router.refresh();
            }, 1500);
        } catch(err) {
          console.error("error while signing out the user", err);
          toast.error("Couldn't log out", ToastStyles)
        }
      }
    
  return (
    <button
      onClick={handleSignOut}
      className="btn btn-ghost justify-start w-full mt-4 text-error"
    >
      <span className="mr-2">
        <FaSignOutAlt />
      </span>{" "}
      Sign Out
    </button>
  );
};

export default SignOut;
