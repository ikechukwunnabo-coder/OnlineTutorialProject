import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} — beginner-first programming tutorials`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#eef4f0",
          color: "#10201b",
          fontFamily: "sans-serif",
          padding: "64px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 64,
            top: 64,
            width: 160,
            height: 160,
            background: "#2348e8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: 54,
            fontWeight: 700,
          }}
        >
          {"</>"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 42, height: 6, background: "#f05a28" }} />
            <div style={{ fontFamily: "monospace", fontSize: 24, color: "#2348e8" }}>
              A beginner-first programming library
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 92, lineHeight: 0.98, letterSpacing: "-5px", fontWeight: 700 }}>
              Start with one line.
            </div>
            <div style={{ fontSize: 92, lineHeight: 0.98, letterSpacing: "-5px", fontWeight: 700 }}>
              Then another.
            </div>
            <div style={{ marginTop: 28, fontSize: 30, color: "#52655e" }}>
              Short chapters. Working examples. No prior experience needed.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{siteConfig.name}</div>
            <div style={{ fontFamily: "monospace", fontSize: 22, color: "#52655e" }}>
              learn by making
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
