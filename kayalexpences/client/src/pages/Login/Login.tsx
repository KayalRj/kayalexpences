import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import SpiderBackground from "../../components/SpiderBackground";
import SpiderWebParticles from "../../components/SpiderWebParticles";
import SpiderManHero from "../../components/SpiderManHero";
import SpiderLoginForm from "../../components/SpiderLoginForm";

interface LoginProps {
  onLogin?: (email: string) => void;
  onLoginSuccess?: (email: string) => void;
}

export default function Login({ onLogin, onLoginSuccess }: LoginProps) {
  const handleSuccess = (userEmail: string) => {
    if (onLogin) onLogin(userEmail);
    if (onLoginSuccess) onLoginSuccess(userEmail);
  };

  // Dual form visibility states for desktop
  const [showRightForm, setShowRightForm] = useState(false);
  const [showLeftForm, setShowLeftForm] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  // Mobile dedicated modal & tab state
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth <= 900;
    }
    return false;
  });
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"login" | "register">("login");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const promptRef = useRef<HTMLDivElement | null>(null);
  const rightFormRef = useRef<HTMLDivElement | null>(null);
  const leftFormRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Initial desktop setup: hide both forms clear of Spider-Man
    if (rightFormRef.current) {
      gsap.set(rightFormRef.current, {
        opacity: 0,
        scale: 0.9,
        x: 60,
        pointerEvents: "none",
      });
    }
    if (leftFormRef.current) {
      gsap.set(leftFormRef.current, {
        opacity: 0,
        scale: 0.9,
        x: -60,
        pointerEvents: "none",
      });
    }
  }, []);

  const handleSpiderClick = () => {
    if (isMobile) {
      // Mobile tap toggles the centered form modal
      setMobileFormOpen(prev => !prev);
      return;
    }

    if (isOpening) return;
    setIsOpening(true);

    if (!showRightForm && !showLeftForm) {
      // 1ST CLICK: Reveal Login Form on RIGHT SIDE
      setShowRightForm(true);

      const tl = gsap.timeline({
        onComplete: () => {
          setIsOpening(false);
          if (rightFormRef.current) {
            gsap.set(rightFormRef.current, { pointerEvents: "all" });
          }
        },
      });

      tl.to(rightFormRef.current, {
        opacity: 1,
        scale: 1,
        x: 0,
        duration: 0.7,
        ease: "power3.out",
      });
    } else if (showRightForm && !showLeftForm) {
      // 2ND CLICK: Reveal Register Form on LEFT SIDE (BOTH STAY OPEN)
      setShowLeftForm(true);

      const tl = gsap.timeline({
        onComplete: () => {
          setIsOpening(false);
          if (leftFormRef.current) {
            gsap.set(leftFormRef.current, { pointerEvents: "all" });
          }
        },
      });

      tl.to(leftFormRef.current, {
        opacity: 1,
        scale: 1,
        x: 0,
        duration: 0.7,
        ease: "power3.out",
      });
    } else {
      // 3RD CLICK: Close both forms to reset interactive sequence
      setShowRightForm(false);
      setShowLeftForm(false);

      const tl = gsap.timeline({
        onComplete: () => {
          setIsOpening(false);
        },
      });

      tl.to(
        [rightFormRef.current, leftFormRef.current],
        {
          opacity: 0,
          scale: 0.9,
          duration: 0.4,
          ease: "power2.in",
          pointerEvents: "none",
        }
      );
    }
  };

  const getPromptText = () => {
    if (isMobile) {
      return mobileFormOpen ? "🕸️ TAP SPIDER-MAN TO CLOSE FORM 🕷️" : "🕷️ TAP SPIDER-MAN TO SIGN IN / REGISTER 🕸️";
    }
    if (!showRightForm && !showLeftForm) return "🕷️ TAP SPIDER-MAN FOR SIGN IN (RIGHT) 🕸️";
    if (showRightForm && !showLeftForm) return "🕸️ TAP SPIDER-MAN TO OPEN REGISTER FORM (LEFT) 🕷️";
    return "🕷️ BOTH SPIDER VAULT GATES OPEN (TAP TO CLOSE) 🕸️";
  };

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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
      }}
    >
      <style>{`
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>

      {/* Background Image (spidybg.png) */}
      <SpiderBackground />

      {/* Spider Web Floating Particles */}
      <SpiderWebParticles isWebSlinging={showRightForm || showLeftForm || mobileFormOpen} />

      {/* Main Interactive Screen Viewport */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          boxSizing: "border-box",
          padding: "16px",
        }}
      >
        {/* DESKTOP LEFT SIDE FORM CONTAINER: Register Form */}
        {!isMobile && (
          <div
            style={{
              position: "absolute",
              right: "calc(50% + 280px)",
              top: "47%",
              transform: "translateY(-50%)",
              width: "100%",
              maxWidth: "390px",
              zIndex: 25,
            }}
          >
            <SpiderLoginForm
              ref={leftFormRef}
              onLoginSuccess={handleSuccess}
              activeTab="register"
            />
          </div>
        )}

        {/* CENTER: Fixed Spider-Man Hero Figure */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
          <SpiderManHero
            onClick={handleSpiderClick}
            isOpen={isMobile ? mobileFormOpen : showRightForm || showLeftForm}
            isOpening={isOpening}
            heroRef={heroRef}
            promptRef={promptRef}
            promptText={getPromptText()}
          />

          {/* Quick Mobile Tap-to-Open Action Buttons */}
          {isMobile && !mobileFormOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "16px", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => {
                  setMobileTab("login");
                  setMobileFormOpen(true);
                }}
                style={{
                  padding: "10px 22px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #ff003c 0%, #990022 100%)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 900,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  border: "1px solid rgba(255, 0, 60, 0.6)",
                  boxShadow: "0 4px 18px rgba(255, 0, 60, 0.5)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                🕷️ Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileTab("register");
                  setMobileFormOpen(true);
                }}
                style={{
                  padding: "10px 22px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #00e5ff 0%, #0277bd 100%)",
                  color: "#000000",
                  fontSize: "13px",
                  fontWeight: 900,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  border: "1px solid rgba(0, 229, 255, 0.6)",
                  boxShadow: "0 4px 18px rgba(0, 229, 255, 0.5)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                🕸️ Register
              </button>
            </div>
          )}
        </div>

        {/* DESKTOP RIGHT SIDE FORM CONTAINER: Login Form */}
        {!isMobile && (
          <div
            style={{
              position: "absolute",
              left: "calc(50% + 280px)",
              top: "50%",
              transform: "translateY(-50%)",
              width: "100%",
              maxWidth: "350px",
              zIndex: 25,
            }}
          >
            <SpiderLoginForm
              ref={rightFormRef}
              onLoginSuccess={handleSuccess}
              activeTab="login"
            />
          </div>
        )}

        {/* MOBILE DEDICATED CENTERED FORM MODAL (When isMobile & mobileFormOpen) */}
        {isMobile && mobileFormOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              padding: "20px 14px 40px",
              background: "rgba(3, 6, 14, 0.85)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setMobileFormOpen(false);
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "390px",
                margin: "auto",
                animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <SpiderLoginForm
                onLoginSuccess={handleSuccess}
                activeTab={mobileTab}
                onTabChange={setMobileTab}
                onClose={() => setMobileFormOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
