import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ChatBot SaaS social preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "radial-gradient(circle at top right, rgba(140,154,132,0.24), transparent 35%), linear-gradient(135deg, #F9F8F4 0%, #F2F0EB 100%)",
          color: "#2D3A31",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            color: "#8C9A84",
            fontSize: 24,
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 9999,
              background: "rgba(140,154,132,0.18)",
              border: "2px solid rgba(140,154,132,0.25)",
            }}
          />
          AI-Powered Support
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 880 }}>
          <div
            style={{
              fontSize: 82,
              lineHeight: 1.02,
              fontWeight: 700,
              letterSpacing: -3,
            }}
          >
            Your website, now answers questions.
          </div>
          <div
            style={{
              fontSize: 32,
              lineHeight: 1.35,
              color: "rgba(45,58,49,0.72)",
              maxWidth: 760,
            }}
          >
            Create an AI chatbot trained on your content in minutes and embed it anywhere with a
            single script tag.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "22px 28px",
              borderRadius: 28,
              background: "#FFFFFF",
              boxShadow: "0 24px 60px rgba(45,58,49,0.12)",
            }}
          >
            <div
              style={{
                fontSize: 18,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "#8C9A84",
              }}
            >
              Setup time
            </div>
            <div style={{ fontSize: 42, fontWeight: 700 }}>&lt; 5 min</div>
          </div>

          <div style={{ fontSize: 30, fontWeight: 600 }}>ChatBot SaaS</div>
        </div>
      </div>
    ),
    size
  );
}
