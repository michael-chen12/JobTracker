import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Job Application Tracker — AI-Powered Job Search";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 86400; // cache for 24 hours

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #dbeafe 0%, transparent 50%), " +
            "radial-gradient(circle at 80% 80%, #e0e7ff 0%, transparent 50%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 20,
            background: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: "-2px",
            marginBottom: 32,
            boxShadow: "0 20px 40px rgba(37,99,235,0.3)",
          }}
        >
          JT
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#0f172a",
            margin: 0,
            marginBottom: 16,
            letterSpacing: "-2px",
          }}
        >
          Job Application Tracker
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#64748b",
            margin: 0,
            textAlign: "center",
            maxWidth: 760,
          }}
        >
          AI-powered job search — organize, track, and win.
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 40,
          }}
        >
          {["AI Resume Matching", "Kanban Board", "Analytics"].map(
            (label) => (
              <div
                key={label}
                style={{
                  padding: "8px 20px",
                  borderRadius: 9999,
                  background: "white",
                  border: "1.5px solid #e2e8f0",
                  fontSize: 20,
                  color: "#334155",
                  fontWeight: 500,
                }}
              >
                {label}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
