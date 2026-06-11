"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FaGoogle, FaGithub } from "react-icons/fa";
import ShowHidePassword from "@/components/auth/ShowHidePassword";
import { toast } from "react-toastify";
import ToastStyles from "@/styles/ToastStyles";
import { useRouter } from "next/navigation";
import ValidateEmailInput from "@/components/auth/ValidateEmailInput";
import { signIn } from "next-auth/react";

const Login = () => {
  const [ValidEmail, setValidEmail] = useState<boolean>(false);
  const router = useRouter();
  return (
    <div className="w-[55%] max-md:w-full flex items-center justify-center md:p-8 ">
      <div className="w-full max-w-md">
        <div className="backdrop-blur-md bg-base-300 p-8 rounded-xl shadow-lg">
          <div className="text-center mb-2">
            <h1 className={`text-3xl font-bold`}>Welcome Back</h1>
            <p className={`text-base-content mt-2`}>
              Please sign in to your account
            </p>
          </div>

          <div className="flex flex-col space-y-4 mb-6">
            <form
              action={async (formdata: FormData): Promise<void> => {
                const email = formdata.get("email") as string;
                const password = formdata.get("password") as string;

                const result = await signIn("credentials", {
                  redirect: false,
                  email,
                  password,
                });

                if (result?.error) {
                  toast.error("Invalid email or password", ToastStyles);
                } else {
                  toast.success("Signed in successfully", ToastStyles);
                  setTimeout(() => {
                    router.push("/dashboard");
                  }, 2000);
                }
              }}
              className="space-y-6 mt-6"
            >
              <ValidateEmailInput
                ValidEmail={ValidEmail}
                setValidEmail={setValidEmail}
              />
              <ShowHidePassword />

              <button
                type="submit"
                className="w-full btn btn-secondary"
                disabled={!ValidEmail}
              >
                Sign In
              </button>
            </form>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              <span className="flex-shrink mx-4 text-base-content text-sm">
                or
              </span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            <button
              onClick={() => signIn("google", { prompt: "select_account" })}
              className="flex items-center justify-center w-full btn btn-primary"
            >
              <FaGoogle className="mr-2" />
              <span className="font-medium">Sign in with Google</span>
            </button>
            <button
              onClick={() => signIn("github")}
              className="flex items-center justify-center w-full btn btn-primary"
            >
              <FaGithub className="mr-2" />
              <span className="font-medium">Sign in with GitHub</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-base-content">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
