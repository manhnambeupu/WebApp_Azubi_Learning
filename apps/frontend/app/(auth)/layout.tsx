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
      <div className="relative z-10 flex flex-col items-center w-full">

        <div className="w-full max-w-5xl animate-in fade-in zoom-in duration-500">
          {children}
        </div>

        {/* Footer Pháp Lý (DSGVO Requirement) */}
        <footer className="mt-8 flex gap-6 text-sm text-white/70 backdrop-blur-sm animate-in fade-in duration-1000 delay-500">
          <a href="/impressum" className="hover:text-white hover:underline transition-colors">Impressum</a>
          <span aria-hidden="true" className="opacity-50">•</span>
          <a href="/datenschutz" className="hover:text-white hover:underline transition-colors">Datenschutzerklärung</a>
        </footer>
      </div>
    </div>
  );
}
