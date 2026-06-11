"use server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/getSession";

import LoginImage from "@/components/auth/LoginImage";
import ThemeToggleFixed from "@/components/auth/ThemeToggleFixed";
import React, { ReactNode } from "react";

const LoginSignUpLayout = async({children}: {children: ReactNode}) => {

  const session = await getSession();
  const user = session?.user;

  if(user) {
    redirect("/dashboard");
  }
  
  return (
    <div className="flex h-screen w-screen max-md:flex-col max-md:justify-center max-md:gap-y-8 bg-base-100">
      <ThemeToggleFixed />
      {/* Background Image */}
      <LoginImage />

      <div className="md:hidden flex w-full justify-center items-center text-3xl font-bold underline decoration-4 underline-offset-4">
        Newsletter Agent
      </div>

      {/* Form Container */}
      { children }
    </div>
  );
};

export default LoginSignUpLayout;
