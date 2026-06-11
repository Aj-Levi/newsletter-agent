"use client";

import Link from "next/link";
import ShowHidePassword from "@/components/auth/ShowHidePassword";
import ValidateEmailInput from "@/components/auth/ValidateEmailInput";
import { toast } from "react-toastify";
import ToastStyles from "@/styles/ToastStyles";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { FaGithub, FaGoogle } from "react-icons/fa";

const Login = () => {
  const [ValidEmail, setValidEmail] = useState<boolean>(false);
  const router = useRouter();
  return (
    <div className="w-[55%] max-md:w-full flex items-center justify-center md:p-8 ">
      <div className="w-full max-w-md">
        <div className="backdrop-blur-md bg-base-300 p-8 rounded-xl shadow-lg">
          <div className="text-center mb-2">
            <h1 className={`text-3xl font-bold`}>Create an Account</h1>
            <p className={`text-base-content mt-2`}>Sign up to get started</p>
          </div>

          <div className="flex flex-col space-y-4 mb-6">
            <form
              action={async (formdata: FormData): Promise<void> => {
                const name = formdata.get("name") as string;
                const email = formdata.get("email") as string;
                const password = formdata.get("password") as string;

                const response = await fetch("/api/user", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ name, email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                  toast.success(data.message, ToastStyles);

                  const signInResult = await signIn("credentials", {
                    redirect: false,
                    email,
                    password,
                  });

                  if (signInResult?.error) {
                    toast.error("Account created, but couldn't log in automatically.", ToastStyles);
                    setTimeout(() => {
                      router.push("/login");
                    }, 2000);
                  } else {
                    setTimeout(() => {
                      router.push("/dashboard");
                    }, 2000);
                  }
                } else {
                  toast.warn(data.error, ToastStyles);
                }
              }}
              className="space-y-4 mt-6"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <label className="input validator w-full">
                  <svg
                    className="h-[1em]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <g
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </g>
                  </svg>
                  <input
                    type="text"
                    placeholder="Full Name"
                    name="name"
                    required
                  />
                </label>
              </div>

              <ValidateEmailInput
                ValidEmail={ValidEmail}
                setValidEmail={setValidEmail}
              />
              <ShowHidePassword />

              <button
                type="submit"
                className="w-full btn btn-primary"
                disabled={!ValidEmail}
              >
                Sign Up
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
              onClick={() => signIn("google")}
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
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
