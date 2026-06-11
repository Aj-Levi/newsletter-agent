import React from "react";
import Image from "next/image";

const LoginImage = () => {
  return (
    <div className="max-md:hidden w-[45%] rounded-r-2xl overflow-clip relative">
      <Image
        src={'/LoginBg.jpg'}
        alt="Newsletter Agent Login"
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
        priority
      />

      <div className="max-md:hidden absolute inset-0 flex flex-col items-center justify-center">
        <div className="backdrop-blur-md bg-white/20 p-8 rounded-xl shadow-lg border border-white/30 max-w-xs w-full">
          <div className="text-center">
            <h1 className={`text-4xl font-bold mb-3 text-white`}>Newsletter Agent</h1>
            <div className="w-16 h-1 bg-white/70 mx-auto mb-3 rounded-full"></div>
            <p className={`text-xl font-medium text-white`}>
              Curated Insights on Autopilot
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginImage;
