import Image from "next/image";
import React from "react";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center p-4"
      style={{
        backgroundImage: "url('/images/bg-login.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      
      <div className="relative z-10 flex -translate-y-[25px] flex-col items-center">
        {/* Header Section */}
        <header className="flex h-fit w-fit flex-col items-center animate-in fade-in zoom-in duration-700">
          <Image
            src="/images/logo.png"
            alt="Hogapruefung logo"
            width={600}
            height={180}
            priority
            className="h-auto w-[280px] object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,1)] drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] sm:w-[400px] md:w-[500px]"
          />
        </header>

        <div className="w-full max-w-4xl animate-in fade-in zoom-in duration-500">
          {children}
        </div>
      </div>
    </div>
  );
}
