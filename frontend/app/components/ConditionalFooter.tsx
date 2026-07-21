"use client";

import { usePathname } from "next/navigation";

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide the footer on any room page
  if (pathname.startsWith("/room/")) return null;

  return (
    <footer className="footer">
      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <span className="logo-text" style={{ fontSize: "1rem" }}>
          FocusFolio
        </span>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            margin: 0,
          }}
        >
          © {new Date().getFullYear()} FocusFolio · Built by John Paul R.
          Martirez
        </p>
      </div>
    </footer>
  );
}
