import React from "react";
import spidybgPng from "../Assects/spidybg.png";

export default function SpiderBackground() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        maxWidth: "100%",
        maxHeight: "100%",
        overflow: "hidden",
        background: "transparent",
        zIndex: 1,
        pointerEvents: "none",
      }}
    >
      {/* 100% Clean Full Bright Background Image (Zero Black Overlay or Darkness) */}
      <img
        src={spidybgPng}
        alt="Spiderverse Background"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          opacity: 1,
          filter: "brightness(1) contrast(1)",
        }}
      />
    </div>
  );
}
