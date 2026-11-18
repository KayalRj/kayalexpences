import React, { forwardRef, useEffect, useRef } from "react";
import spiderJpg from "../Assects/spider.jpg";

interface SpiderManHeroProps {
  onClick: () => void;
  isOpen: boolean;
  isOpening: boolean;
  heroRef: React.RefObject<HTMLDivElement | null>;
  promptRef: React.RefObject<HTMLDivElement | null>;
  promptText?: string;
}

export default forwardRef<HTMLDivElement, SpiderManHeroProps>(function SpiderManHero(
  { onClick, isOpen, isOpening, heroRef, promptRef, promptText },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = spiderJpg;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = (canvas.width = 520);
      const height = (canvas.height = 560);

      // Draw image onto canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Get Pixel Data to key out solid red background
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      const centerX = width / 2;
      const centerY = height * 0.45;
      const maxDist = Math.hypot(width / 2, height / 2);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const pixelIdx = i / 4;
        const x = pixelIdx % width;
        const y = Math.floor(pixelIdx / width);

        const distFromCenter = Math.hypot(x - centerX, y - centerY);
        const normDist = distFromCenter / maxDist;

        // Chroma key check for solid red background color
        const isRedBg = r > 110 && g < 60 && b < 60 && r > g + 50 && r > b + 50;

        if (isRedBg && normDist > 0.32) {
          data[i + 3] = 0; // 100% transparent
        } else if (isRedBg && normDist > 0.25) {
          const alphaFactor = 1 - (normDist - 0.25) / 0.07;
          data[i + 3] = Math.floor(Math.max(0, Math.min(255, 255 * alphaFactor)));
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };
  }, []);

  return (
    <div
      ref={heroRef}
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "540px",
        cursor: "pointer",
        userSelect: "none",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <style>{`
        @keyframes spiderTextPulse {
          0% { transform: scale(1); opacity: 0.88; text-shadow: 0 0 10px #ffffff; }
          50% { transform: scale(1.06); opacity: 1; text-shadow: 0 0 20px #00e5ff; }
          100% { transform: scale(1); opacity: 0.88; text-shadow: 0 0 10px #ffffff; }
        }
      `}</style>

      {/* Spider-Man 3D Figure (Fluid Responsive Centered Container) */}
      <div
        style={{
          position: "relative",
          width: "min(520px, 86vw)",
          height: "min(560px, 92vw)",
          maxHeight: "560px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          boxShadow: "none",
          filter: "none",
        }}
      >
        {/* Canvas Rendered Spider-Man Figure */}
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            filter: "none",
          }}
        />

        {/* Clean Web Badge Overlay */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "clamp(10px, 2.8vw, 12px)",
            fontWeight: 900,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "#ffffff",
            background: "rgba(10, 18, 36, 0.75)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            padding: "6px 18px",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            whiteSpace: "nowrap",
          }}
        >
          🕷️ SPIDER-MAN VAULT GATE
        </div>
      </div>

      {/* PULSING TOUCH TEXT PROMPT */}
      <div
        ref={promptRef}
        style={{
          marginTop: "14px",
          fontSize: "clamp(11px, 3.2vw, 13.5px)",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: ".16em",
          color: "#ffffff",
          animation: "spiderTextPulse 2s infinite ease-in-out",
          textAlign: "center",
          padding: "0 10px",
          maxWidth: "92vw",
        }}
      >
        {promptText || "🕷️ TAP SPIDER-MAN TO UNLOCK VAULT 🕸️"}
      </div>
    </div>
  );
});
