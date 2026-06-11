"use client"
import React from "react";
import { useZustandStore } from "@/lib/ZustandStore";
import { FiSun, FiMoon } from "react-icons/fi";

const ThemeToggleFixed = () => {
  const { currentTheme , toggleTheme } = useZustandStore();

  return (
    <button 
      className="z-30 btn btn-secondary font-semibold fixed top-4 right-4" 
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {currentTheme === "abyss" ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
    </button>
  );
};

export default ThemeToggleFixed;
