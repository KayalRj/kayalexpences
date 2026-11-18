import React, { useState, forwardRef } from "react";
import { toast } from "sonner";
import { authService } from "../services";
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  UserPlus, 
  LogIn, 
  Phone, 
  DollarSign, 
  Key, 
  ArrowRight,
  X
} from "lucide-react";

interface SpiderLoginFormProps {
  onLoginSuccess: (email: string) => void;
  activeTab?: "login" | "register";
  onTabChange?: (tab: "login" | "register") => void;
  onClose?: () => void;
}

const USERS_STORAGE_KEY = "kayal_users_list";
const SECRET_CREATE_WORD = "hogwarts-expectopatronum";

export default forwardRef<HTMLDivElement, SpiderLoginFormProps>(function SpiderLoginForm(
  { onLoginSuccess, activeTab, onTabChange, onClose },
  ref
) {
  const [internalTab, setInternalTab] = useState<"login" | "register">("login");
  const tab = activeTab !== undefined ? activeTab : internalTab;

  const handleTabSwitch = (newTab: "login" | "register") => {
    setInternalTab(newTab);
    if (onTabChange) onTabChange(newTab);
  };

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regMobile, setRegMobile] = useState("");
  const [regSalary, setRegSalary] = useState("");
  const [regSecretWord, setRegSecretWord] = useState("");

  const [isSlinging, setIsSlinging] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password.");
      return;
    }

    setIsSlinging(true);

    try {
      // 1. Try PostgreSQL Backend Login via /api/Auth/login
      const result = await authService.login({
        email: email.trim(),
        password: password.trim(),
      });

      toast.success(`Welcome back, ${result.profile?.fullName || result.email}! 🕷️`);
      onLoginSuccess(result.email);
      return;
    } catch (apiErr: any) {
      // If server responded with 401 or explicit error message
      if (apiErr.response?.status === 401 || apiErr.response?.data?.message) {
        setIsSlinging(false);
        toast.error(apiErr.userFriendlyMessage || "Invalid email or password.");
        return;
      }

      // If backend is offline, check local fallback
      console.warn("Backend not reachable, checking local storage fallback:", apiErr);
      let usersList: any[] = [];
      try {
        const saved = localStorage.getItem(USERS_STORAGE_KEY);
        if (saved) usersList = JSON.parse(saved);
      } catch (err) {
        console.error(err);
      }

      const matchedUser = usersList.find(
        (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
      );

      if (matchedUser && matchedUser.password && matchedUser.password !== password) {
        setIsSlinging(false);
        toast.error("Incorrect password for this account.");
        return;
      }

      if (matchedUser) {
        toast.success(`Welcome back, ${matchedUser.name || matchedUser.email}! 🕷️`);
        onLoginSuccess(matchedUser.email);
        return;
      }

      // Default admin fallback check
      if (
        email.trim().toLowerCase() === "kayalvizhiintn@gmail.com" &&
        password === "baliedinburgh"
      ) {
        toast.success("Welcome back, Kayalvizhi! 🕷️");
        onLoginSuccess("kayalvizhiintn@gmail.com");
        return;
      }

      setIsSlinging(false);
      toast.error(apiErr.userFriendlyMessage || "User not found or invalid credentials.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword.trim()) {
      toast.error("Primary Email and Password are required.");
      return;
    }

    if (regSecretWord.trim() !== SECRET_CREATE_WORD) {
      toast.error("Invalid Secret Word! Contact administrator for authorization.");
      return;
    }

    setIsSlinging(true);

    try {
      // 1. Register user directly into PostgreSQL Database via /api/Auth/register
      const user = await authService.register({
        email: regEmail.trim(),
        password: regPassword.trim(),
        fullName: regName.trim(),
        mobileNumber: regMobile.trim(),
        monthlySalary: Number(regSalary) || 0,
        role: "User",
      });

      // 2. Automatically log in to get token via /api/Auth/login
      try {
        await authService.login({
          email: regEmail.trim(),
          password: regPassword.trim(),
        });
      } catch {}

      // Keep local sync as backup
      let usersList: any[] = [];
      try {
        const saved = localStorage.getItem(USERS_STORAGE_KEY);
        if (saved) usersList = JSON.parse(saved);
      } catch {}
      usersList.push({
        id: user.id,
        name: user.fullName || user.email.split("@")[0],
        email: user.email,
        mobile: user.mobileNumber,
        salary: user.monthlySalary,
        createdAt: user.createdAt,
      });
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersList));

      toast.success("Account created and saved to Database! 🕷️");
      onLoginSuccess(user.email);
    } catch (err: any) {
      setIsSlinging(false);
      toast.error(err.userFriendlyMessage || "Registration failed. Check if user already exists.");
    }
  };

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "400px",
        background: "rgba(6, 10, 20, 0.96)",
        backdropFilter: "blur(35px)",
        WebkitBackdropFilter: "blur(35px)",
        border: tab === "login" ? "1.5px solid rgba(255, 0, 60, 0.8)" : "1.5px solid rgba(0, 229, 255, 0.8)",
        borderRadius: "24px",
        padding: tab === "login" ? "28px 22px" : "20px 20px",
        boxShadow: tab === "login" 
          ? "0 0 60px rgba(255, 0, 60, 0.5), 0 0 120px rgba(0, 229, 255, 0.25), inset 0 0 40px rgba(255, 0, 60, 0.2)"
          : "0 0 60px rgba(0, 229, 255, 0.5), 0 0 120px rgba(255, 0, 60, 0.25), inset 0 0 40px rgba(0, 229, 255, 0.2)",
        zIndex: 20,
        opacity: 1,
        boxSizing: "border-box",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        maxHeight: "88vh",
        overflowY: "auto",
        transition: "all 0.4s ease",
      }}
    >
      <style>{`
        div::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }

        @keyframes hudScanner {
          0% { top: -10%; opacity: 0; }
          15% { opacity: 0.8; }
          85% { opacity: 0.8; }
          100% { top: 110%; opacity: 0; }
        }
        @keyframes spiderRadar {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes webShooterGlow {
          0%, 100% { boxShadow: 0 0 20px rgba(255, 0, 60, 0.6); }
          50% { boxShadow: 0 0 35px rgba(255, 0, 60, 0.9), 0 0 60px rgba(0, 229, 255, 0.5); }
        }

        @keyframes webBlastExpand {
          0% { transform: scale(0.2) rotate(0deg); opacity: 0; }
          40% { opacity: 1; filter: drop-shadow(0 0 25px #ff003c) drop-shadow(0 0 45px #00e5ff); }
          100% { transform: scale(2.2) rotate(45deg); opacity: 0; }
        }
        @keyframes webBlastFlash {
          0% { opacity: 0; }
          30% { opacity: 0.85; }
          100% { opacity: 0; }
        }

        .spider-hud-input {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(12, 18, 32, 0.85) !important;
        }
        .spider-hud-input:focus-within {
          border-color: #ff003c !important;
          box-shadow: 0 0 20px rgba(255, 0, 60, 0.6), inset 0 0 12px rgba(255, 0, 60, 0.25) !important;
          transform: translateY(-1px);
        }
        .spider-hud-input-cyan {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(12, 18, 32, 0.85) !important;
        }
        .spider-hud-input-cyan:focus-within {
          border-color: #00e5ff !important;
          box-shadow: 0 0 20px rgba(0, 229, 255, 0.6), inset 0 0 12px rgba(0, 229, 255, 0.25) !important;
          transform: translateY(-1px);
        }
        @keyframes webButtonPulse {
          0% { transform: scale(1); box-shadow: 0 0 25px rgba(255, 0, 60, 0.7); }
          50% { transform: scale(0.98); box-shadow: 0 0 50px #ff003c, 0 0 70px #00e5ff, inset 0 0 20px #ffffff; }
          100% { transform: scale(1.02); box-shadow: 0 0 35px rgba(0, 229, 255, 0.8); }
        }
        @keyframes webShockwave {
          0% { opacity: 1; transform: scale(0.8); filter: drop-shadow(0 0 15px #ff003c); }
          100% { opacity: 0; transform: scale(2.2); filter: drop-shadow(0 0 30px #00e5ff); }
        }
        @keyframes sideWebSnap {
          0% { stroke-dashoffset: 300; opacity: 0.2; }
          50% { opacity: 1; filter: drop-shadow(0 0 10px #ffffff); }
          100% { stroke-dashoffset: 0; opacity: 0.8; }
        }
      `}</style>

      {/* Sleek Mobile Close Button (When onClose is provided) */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            zIndex: 40,
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: tab === "login" ? "1px solid rgba(255, 0, 60, 0.6)" : "1px solid rgba(0, 229, 255, 0.6)",
            background: "rgba(10, 18, 32, 0.85)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: tab === "login" ? "0 0 12px rgba(255, 0, 60, 0.4)" : "0 0 12px rgba(0, 229, 255, 0.4)",
          }}
        >
          <X size={16} />
        </button>
      )}

      {/* Futuristic Vertical Scanning Beam Overlay */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "4px",
          background: tab === "login"
            ? "linear-gradient(90deg, transparent 0%, #ff003c 50%, transparent 100%)"
            : "linear-gradient(90deg, transparent 0%, #00e5ff 50%, transparent 100%)",
          boxShadow: tab === "login" ? "0 0 15px #ff003c" : "0 0 15px #00e5ff",
          pointerEvents: "none",
          zIndex: 4,
          animation: "hudScanner 4s ease-in-out infinite",
        }}
      />

      {/* Cyber HUD Corner Brackets */}
      {/* Top-Left Corner */}
      <div style={{ position: "absolute", top: "8px", left: "8px", width: "18px", height: "18px", borderTop: `2.5px solid ${tab === "login" ? "#ff003c" : "#00e5ff"}`, borderLeft: `2.5px solid ${tab === "login" ? "#ff003c" : "#00e5ff"}`, zIndex: 10, filter: "drop-shadow(0 0 5px currentColor)" }} />
      {/* Top-Right Corner */}
      <div style={{ position: "absolute", top: "8px", right: "8px", width: "18px", height: "18px", borderTop: `2.5px solid ${tab === "login" ? "#ff003c" : "#00e5ff"}`, borderRight: `2.5px solid ${tab === "login" ? "#ff003c" : "#00e5ff"}`, zIndex: 10, filter: "drop-shadow(0 0 5px currentColor)" }} />
      {/* Bottom-Left Corner */}
      <div style={{ position: "absolute", bottom: "8px", left: "8px", width: "18px", height: "18px", borderBottom: `2.5px solid ${tab === "login" ? "#ff003c" : "#00e5ff"}`, borderLeft: `2.5px solid ${tab === "login" ? "#ff003c" : "#00e5ff"}`, zIndex: 10, filter: "drop-shadow(0 0 5px currentColor)" }} />
      {/* Bottom-Right Corner */}
      <div style={{ position: "absolute", bottom: "8px", right: "8px", width: "18px", height: "18px", borderBottom: `2.5px solid ${tab === "login" ? "#ff003c" : "#00e5ff"}`, borderRight: `2.5px solid ${tab === "login" ? "#ff003c" : "#00e5ff"}`, zIndex: 10, filter: "drop-shadow(0 0 5px currentColor)" }} />

      {/* SVG Intricate Spider Web Background Canvas */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
          opacity: 0.4,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="webGlowRed" cx="50%" cy="0%" r="70%">
            <stop offset="0%" stopColor="#ff003c" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ff003c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="webGlowCyan" cx="50%" cy="100%" r="70%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#webGlowRed)" />
        <rect width="100%" height="100%" fill="url(#webGlowCyan)" />

        {/* Intricate Web Mesh Lines */}
        <path d="M 0,0 L 150,150 M 0,0 L 200,80 M 0,0 L 80,200 M 0,0 L 250,0 M 0,0 L 0,250" stroke="#ff003c" strokeWidth="1.2" opacity="0.4" fill="none" />
        <path d="M 40,0 Q 40,40 0,40 M 80,0 Q 80,80 0,80 M 120,0 Q 120,120 0,120 M 160,0 Q 160,160 0,160 M 200,0 Q 200,200 0,200" stroke="#ff003c" strokeWidth="1.2" fill="none" opacity="0.4" />

        <path d="M 400,0 L 250,150 M 400,0 L 200,80 M 400,0 L 320,200" stroke="#00e5ff" strokeWidth="1.2" opacity="0.4" fill="none" />
        <path d="M 360,0 Q 360,40 400,40 M 320,0 Q 320,80 400,80 M 280,0 Q 280,120 400,120 M 240,0 Q 240,160 400,160" stroke="#00e5ff" strokeWidth="1.2" fill="none" opacity="0.4" />
      </svg>

      {/* Spider Web Corner Node Badges */}
      <div style={{ position: "absolute", top: "10px", left: "12px", zIndex: 10, animation: "webPulse 3s infinite ease-in-out" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff003c" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3" fill="#ff003c" />
          <path d="M12 2v7M12 15v7M2 12h7M15 12h7M4.93 4.93l4.95 4.95M14.12 14.12l4.95 4.95M4.93 19.07l4.95-4.95M14.12 9.88l4.95-4.95" />
        </svg>
      </div>

      <div style={{ position: "absolute", top: "10px", right: "12px", zIndex: 10, animation: "cyanWebPulse 3s infinite ease-in-out" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3" fill="#00e5ff" />
          <path d="M12 2v7M12 15v7M2 12h7M15 12h7M4.93 4.93l4.95 4.95M14.12 14.12l4.95 4.95M4.93 19.07l4.95-4.95M14.12 9.88l4.95-4.95" />
        </svg>
      </div>

      {/* Top Header Badge & Spider Emblem */}
      <div style={{ textAlign: "center", marginBottom: tab === "login" ? "18px" : "10px", position: "relative", zIndex: 5 }}>
        {/* Futuristic Metallic Spider Emblem */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: tab === "login" 
                ? "radial-gradient(circle, rgba(255,0,60,0.3) 0%, rgba(10,14,26,0.9) 100%)" 
                : "radial-gradient(circle, rgba(0,229,255,0.3) 0%, rgba(10,14,26,0.9) 100%)",
              border: `1.5px solid ${tab === "login" ? "#ff003c" : "#00e5ff"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: tab === "login" ? "0 0 18px rgba(255,0,60,0.6)" : "0 0 18px rgba(0,229,255,0.6)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={tab === "login" ? "#ff003c" : "#00e5ff"}>
              <path d="M12 2C10.5 2 9.5 3.5 9.5 5C9.5 6 10 7 11 7.5V9C10 9 8 8.5 7 7C6 5.5 4 5 3 5C2.5 5 2 5.5 2 6C2 8 4 10 6 11C7.5 11.8 9 11.5 10 11V12.5C8.5 13 6 13.5 4 12C2.5 11 1 11 1 12C1 13.5 3 15 5 15.5C7 16 9.5 15 10.5 14V16C9 17 6.5 17.5 5 19C4 20 4 21 5 21C6.5 21 8.5 19.5 10 18V21C10 21.5 10.5 22 11 22H13C13.5 22 14 21.5 14 21V18C15.5 19.5 17.5 21 19 21C20 21 20 20 19 19C17.5 17.5 15 17 13.5 16V14C14.5 15 17 16 19 15.5C21 15 23 13.5 23 12C23 11 21.5 11 20 12C18 13.5 15.5 13 14 12.5V11C15 11.5 16.5 11.8 18 11C20 10 22 8 22 6C22 5.5 21.5 5 21 5C20 5 18 5.5 17 7C16 8.5 14 9 13 9V7.5C14 7 14.5 6 14.5 5C14.5 3.5 13.5 2 12 2Z" />
            </svg>
          </div>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 14px",
            borderRadius: "16px",
            background: tab === "login" ? "rgba(255, 0, 60, 0.18)" : "rgba(0, 229, 255, 0.18)",
            color: tab === "login" ? "#ff003c" : "#00e5ff",
            border: tab === "login" ? "1px solid rgba(255, 0, 60, 0.45)" : "1px solid rgba(0, 229, 255, 0.45)",
            fontSize: "11px",
            fontWeight: 900,
            letterSpacing: ".15em",
            textTransform: "uppercase",
            marginBottom: "6px",
            boxShadow: tab === "login" ? "0 0 12px rgba(255, 0, 60, 0.25)" : "0 0 12px rgba(0, 229, 255, 0.25)",
          }}
        >
          🕸️ SPIDERVERSE ACCESS VAULT
        </span>

        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: "#ffffff", fontSize: "1.8rem", margin: 0, textShadow: "0 2px 10px rgba(0,0,0,0.8)", letterSpacing: "0.02em" }}>
          {tab === "login" ? "Spider Sign In" : "Register Web Vault"}
        </h2>
      </div>

      {/* Segmented Tab Switcher */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "rgba(255, 255, 255, 0.05)",
          padding: "4px",
          borderRadius: "14px",
          border: tab === "login" ? "1px solid rgba(255, 0, 60, 0.4)" : "1px solid rgba(0, 229, 255, 0.4)",
          marginBottom: tab === "login" ? "20px" : "12px",
          transition: "border-color 0.3s ease",
        }}
      >
        <button
          type="button"
          onClick={() => handleTabSwitch("login")}
          style={{
            padding: "9px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            transition: "all 0.3s ease",
            background: tab === "login" ? "linear-gradient(135deg, #ff003c 0%, #990022 100%)" : "transparent",
            color: tab === "login" ? "#ffffff" : "#dfc7b5",
            boxShadow: tab === "login" ? "0 3px 14px rgba(255, 0, 60, 0.6)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <LogIn size={15} /> Sign In
        </button>
        <button
          type="button"
          onClick={() => handleTabSwitch("register")}
          style={{
            padding: "9px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            transition: "all 0.3s ease",
            background: tab === "register" ? "linear-gradient(135deg, #00e5ff 0%, #0277bd 100%)" : "transparent",
            color: tab === "register" ? "#000000" : "#dfc7b5",
            boxShadow: tab === "register" ? "0 3px 14px rgba(0, 229, 255, 0.6)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <UserPlus size={15} /> Register
        </button>
      </div>

      {/* LOGIN FORM (Exact original inputs & logic, elevated with Spider Web HUD Theme) */}
      {tab === "login" && (
        <form onSubmit={handleLogin} style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".12em", color: "#ff003c", marginBottom: "6px" }}>
              <span>Email Address</span>
              <span style={{ fontSize: "9.5px", color: "rgba(255,0,60,0.7)", letterSpacing: "0.05em" }}>[ HUD SECURED ]</span>
            </label>
            <div className="spider-hud-input" style={{ display: "flex", alignItems: "center", border: "1px solid rgba(255, 0, 60, 0.45)", borderRadius: "12px", overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
              <div style={{ padding: "10px 12px", background: "rgba(255, 0, 60, 0.2)", borderRight: "1px solid rgba(255, 0, 60, 0.35)", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <Mail size={16} style={{ color: "#ff003c" }} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter registered email"
                style={{ flex: 1, minWidth: 0, width: "100%", padding: "10px 12px", background: "transparent", border: "none", color: "#ffffff", fontSize: "14px", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".12em", color: "#ff003c", marginBottom: "6px" }}>
              <span>Password</span>
              <span style={{ fontSize: "9.5px", color: "rgba(255,0,60,0.7)", letterSpacing: "0.05em" }}>[ ENCRYPTED ]</span>
            </label>
            <div className="spider-hud-input" style={{ display: "flex", alignItems: "center", border: "1px solid rgba(255, 0, 60, 0.45)", borderRadius: "12px", overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
              <div style={{ padding: "10px 12px", background: "rgba(255, 0, 60, 0.2)", borderRight: "1px solid rgba(255, 0, 60, 0.35)", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <Lock size={16} style={{ color: "#ff003c" }} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                style={{ flex: 1, minWidth: 0, width: "100%", padding: "10px 12px", background: "transparent", border: "none", color: "#ffffff", fontSize: "14px", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: "transparent", border: "none", color: "#a0aec0", padding: "0 12px", cursor: "pointer", flexShrink: 0 }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              position: "relative",
              width: "100%",
              padding: "13.5px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #e60026 0%, #a8001c 60%, #700012 100%)",
              color: "#ffffff",
              fontWeight: 900,
              fontSize: "14.5px",
              border: "1px solid rgba(255, 0, 60, 0.8)",
              cursor: "pointer",
              boxShadow: isSlinging
                ? "0 0 50px #ff003c, inset 0 0 20px #ffffff"
                : "0 0 25px rgba(230, 0, 38, 0.75), inset 0 0 12px rgba(255, 255, 255, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "8px",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              animation: isSlinging ? "webButtonPulse 0.6s ease-in-out infinite" : "none",
            }}
          >
            {/* Sleek Dynamic Web Shockwave Ring on Click (Zero Text Occlusion) */}
            {isSlinging && (
              <div
                style={{
                  position: "absolute",
                  inset: "-20px",
                  borderRadius: "20px",
                  border: "2px solid #ff003c",
                  pointerEvents: "none",
                  animation: "webShockwave 0.6s ease-out infinite",
                }}
              />
            )}

            <span style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: "8px", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
              {isSlinging ? "⚡ CONNECTING SPIDER VAULT..." : "Web-Sling to Vault"} <ArrowRight size={17} />
            </span>
          </button>
        </form>
      )}

      {/* REGISTER FORM (Exact original inputs & logic, elevated with Spider Web HUD Theme) */}
      {tab === "register" && (
        <form onSubmit={handleRegister} style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", gap: "9px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".1em", color: "#00e5ff", marginBottom: "2px" }}>
              Full Name
            </label>
            <div className="spider-hud-input-cyan" style={{ display: "flex", alignItems: "center", border: "1px solid rgba(0, 229, 255, 0.4)", borderRadius: "10px", overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
              <div style={{ padding: "7px 10px", background: "rgba(0, 229, 255, 0.18)", borderRight: "1px solid rgba(0, 229, 255, 0.3)", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <UserPlus size={15} style={{ color: "#00e5ff" }} />
              </div>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Kayalvizhi"
                style={{ flex: 1, minWidth: 0, width: "100%", padding: "7px 10px", background: "transparent", border: "none", color: "#ffffff", fontSize: "13.5px", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".1em", color: "#00e5ff", marginBottom: "2px" }}>
              Primary Email *
            </label>
            <div className="spider-hud-input-cyan" style={{ display: "flex", alignItems: "center", border: "1px solid rgba(0, 229, 255, 0.4)", borderRadius: "10px", overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
              <div style={{ padding: "7px 10px", background: "rgba(0, 229, 255, 0.18)", borderRight: "1px solid rgba(0, 229, 255, 0.3)", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <Mail size={15} style={{ color: "#00e5ff" }} />
              </div>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                placeholder="user@gmail.com"
                style={{ flex: 1, minWidth: 0, width: "100%", padding: "7px 10px", background: "transparent", border: "none", color: "#ffffff", fontSize: "13.5px", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".1em", color: "#00e5ff", marginBottom: "2px" }}>
              Password *
            </label>
            <div className="spider-hud-input-cyan" style={{ display: "flex", alignItems: "center", border: "1px solid rgba(0, 229, 255, 0.4)", borderRadius: "10px", overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
              <div style={{ padding: "7px 10px", background: "rgba(0, 229, 255, 0.18)", borderRight: "1px solid rgba(0, 229, 255, 0.3)", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <Lock size={15} style={{ color: "#00e5ff" }} />
              </div>
              <input
                type={showRegPassword ? "text" : "password"}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                placeholder="Account password"
                style={{ flex: 1, minWidth: 0, width: "100%", padding: "7px 10px", background: "transparent", border: "none", color: "#ffffff", fontSize: "13.5px", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
              />
              <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} style={{ background: "transparent", border: "none", color: "#a0aec0", padding: "0 10px", cursor: "pointer", flexShrink: 0 }}>
                {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".1em", color: "#00e5ff", marginBottom: "2px" }}>
              Mobile Number
            </label>
            <div className="spider-hud-input-cyan" style={{ display: "flex", alignItems: "center", border: "1px solid rgba(0, 229, 255, 0.4)", borderRadius: "10px", overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
              <div style={{ padding: "7px 10px", background: "rgba(0, 229, 255, 0.18)", borderRight: "1px solid rgba(0, 229, 255, 0.3)", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <Phone size={15} style={{ color: "#00e5ff" }} />
              </div>
              <input
                type="tel"
                value={regMobile}
                onChange={(e) => setRegMobile(e.target.value)}
                placeholder="Mobile number"
                style={{ flex: 1, minWidth: 0, width: "100%", padding: "7px 10px", background: "transparent", border: "none", color: "#ffffff", fontSize: "13.5px", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".1em", color: "#00e5ff", marginBottom: "2px" }}>
              Monthly Salary (₹)
            </label>
            <div className="spider-hud-input-cyan" style={{ display: "flex", alignItems: "center", border: "1px solid rgba(0, 229, 255, 0.4)", borderRadius: "10px", overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
              <div style={{ padding: "7px 10px", background: "rgba(0, 229, 255, 0.18)", borderRight: "1px solid rgba(0, 229, 255, 0.3)", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <DollarSign size={15} style={{ color: "#00e5ff" }} />
              </div>
              <input
                type="number"
                min="0"
                value={regSalary}
                onChange={(e) => setRegSalary(e.target.value)}
                placeholder="Monthly salary (e.g. 50000)"
                style={{ flex: 1, minWidth: 0, width: "100%", padding: "7px 10px", background: "transparent", border: "none", color: "#ffffff", fontSize: "13.5px", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".1em", color: "#ff003c", marginBottom: "2px" }}>
              Create User Word *
            </label>
            <div className="spider-hud-input" style={{ display: "flex", alignItems: "center", border: "1px solid rgba(255, 0, 60, 0.55)", borderRadius: "10px", overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
              <div style={{ padding: "7px 10px", background: "rgba(255, 0, 60, 0.2)", borderRight: "1px solid rgba(255, 0, 60, 0.35)", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <Key size={15} style={{ color: "#ff003c" }} />
              </div>
              <input
                type="password"
                value={regSecretWord}
                onChange={(e) => setRegSecretWord(e.target.value)}
                required
                placeholder="Secret word"
                style={{ flex: 1, minWidth: 0, width: "100%", padding: "7px 10px", background: "transparent", border: "none", color: "#ffffff", fontSize: "13.5px", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              position: "relative",
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #00d2ff 0%, #0072ff 60%, #004bbf 100%)",
              color: "#ffffff",
              fontWeight: 900,
              fontSize: "14px",
              border: "1px solid rgba(0, 210, 255, 0.8)",
              cursor: "pointer",
              boxShadow: isSlinging
                ? "0 0 50px #00e5ff, inset 0 0 20px #ffffff"
                : "0 0 25px rgba(0, 210, 255, 0.75), inset 0 0 12px rgba(255, 255, 255, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "4px",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              animation: isSlinging ? "webButtonPulse 0.6s ease-in-out infinite" : "none",
            }}
          >
            {/* Sleek Dynamic Web Shockwave Ring on Click (Zero Text Occlusion) */}
            {isSlinging && (
              <div
                style={{
                  position: "absolute",
                  inset: "-20px",
                  borderRadius: "20px",
                  border: "2px solid #00e5ff",
                  pointerEvents: "none",
                  animation: "webShockwave 0.6s ease-out infinite",
                }}
              />
            )}

            <span style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: "8px", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
              {isSlinging ? "⚡ CREATING SPIDER VAULT..." : "Register & Start Vault"} <UserPlus size={16} />
            </span>
          </button>
        </form>
      )}
    </div>
  );
});

