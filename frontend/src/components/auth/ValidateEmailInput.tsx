"use client";
import React, { useEffect, useState } from "react";

const ValidateEmailInput = ({ValidEmail, setValidEmail}: {ValidEmail: boolean, setValidEmail: (val: boolean) => void}) => {
  const [Email, setEmail] = useState<string>("");

  useEffect(() => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(emailRegex.test(Email)) {
      setValidEmail(true);
    } else {
      setValidEmail(false);
    }
  }, [Email]);

  return (
    <>
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
            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </g>
        </svg>
        <input
          type="email"
          placeholder="mail@site.com"
          name="email"
          value={Email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
            setEmail(e.target.value)
          }
          required
        />
      </label>
      <div className={`text-red-500 pl-2 ${ValidEmail ? "hidden" : "block"}`}>
        Enter valid email address
      </div>
    </>
  );
};

export default ValidateEmailInput;
