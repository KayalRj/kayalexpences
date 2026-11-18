import { useState } from "react";
import { toast } from "sonner";
import { User, Mail, Phone, MapPin, DollarSign, ShieldCheck, Save, X, Lock } from "lucide-react";

export interface UserProfile {
  email: string;
  backupEmail: string;
  mobileNumber: string;
  place: string;
  monthlySalary: number;
  createdAt?: string;
}

export const PROFILE_STORAGE_KEY = "kayal_user_profile";
export const EMAIL_KEY = "kayal_user_email";
export const PASSWORD_KEY = "kayal_user_password";

export function getUserProfile(): UserProfile {
  const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  const defaultEmail = localStorage.getItem(EMAIL_KEY) || "kayalvizhiintn@gmail.com";
  return {
    email: defaultEmail,
    backupEmail: "",
    mobileNumber: "",
    place: "",
    monthlySalary: 0,
  };
}

interface ProfileModalProps {
  onClose: () => void;
  onProfileUpdated?: (profile: UserProfile) => void;
}

export default function ProfileModal({ onClose, onProfileUpdated }: ProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [password, setPassword] = useState(localStorage.getItem(PASSWORD_KEY) || "");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.email.trim() || !profile.email.includes("@")) {
      toast.error("Please enter a valid primary Email ID.");
      return;
    }

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    localStorage.setItem(EMAIL_KEY, profile.email.trim().toLowerCase());
    if (password.trim()) {
      localStorage.setItem(PASSWORD_KEY, password.trim());
    }

    toast.success("User profile details updated successfully!");
    if (onProfileUpdated) {
      onProfileUpdated(profile);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 2, 6, 0.82)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "linear-gradient(135deg, rgba(26, 15, 10, 0.96), rgba(16, 9, 6, 0.98))",
          border: "1.5px solid rgba(198, 116, 68, 0.35)",
          borderRadius: "22px",
          padding: "28px 32px",
          color: "#ffffff",
          boxShadow: "0 25px 65px rgba(0, 0, 0, 0.85)",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #b86a3c, #8c4c28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff"
              }}
            >
              <User size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.35rem", margin: 0, color: "#ffffff", fontWeight: 800 }}>My Account Profile</h2>
              <span style={{ fontSize: "12px", color: "#dfc7b5" }}>User Details & Credentials</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(198, 116, 68, 0.3)",
              color: "#dfc7b5",
              borderRadius: "10px",
              padding: "6px",
              cursor: "pointer"
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Primary Email */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#e59b6e", marginBottom: "6px" }}>
              Primary Email ID *
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Mail size={16} style={{ position: "absolute", left: "12px", color: "#e59b6e" }} />
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 38px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(198, 116, 68, 0.35)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Backup Email */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#e59b6e", marginBottom: "6px" }}>
              Backup Email ID (Optional Recovery)
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <ShieldCheck size={16} style={{ position: "absolute", left: "12px", color: "#e59b6e" }} />
              <input
                type="email"
                value={profile.backupEmail}
                onChange={(e) => setProfile({ ...profile, backupEmail: e.target.value })}
                placeholder="backup@example.com"
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 38px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(198, 116, 68, 0.35)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
            {/* Mobile Number */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#e59b6e", marginBottom: "6px" }}>
                Mobile Number
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Phone size={16} style={{ position: "absolute", left: "12px", color: "#e59b6e" }} />
                <input
                  type="tel"
                  value={profile.mobileNumber}
                  onChange={(e) => setProfile({ ...profile, mobileNumber: e.target.value })}
                  placeholder="+91 9876543210"
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 38px",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(198, 116, 68, 0.35)",
                    borderRadius: "10px",
                    color: "#ffffff",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            {/* Place / Location */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#e59b6e", marginBottom: "6px" }}>
                Place / City
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <MapPin size={16} style={{ position: "absolute", left: "12px", color: "#e59b6e" }} />
                <input
                  type="text"
                  value={profile.place}
                  onChange={(e) => setProfile({ ...profile, place: e.target.value })}
                  placeholder="e.g. Chennai / Edinburgh"
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 38px",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(198, 116, 68, 0.35)",
                    borderRadius: "10px",
                    color: "#ffffff",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Monthly Salary */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#e59b6e", marginBottom: "6px" }}>
              Monthly Salary (₹)
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <DollarSign size={16} style={{ position: "absolute", left: "12px", color: "#e59b6e" }} />
              <input
                type="number"
                min="0"
                value={profile.monthlySalary || ""}
                onChange={(e) => setProfile({ ...profile, monthlySalary: Number(e.target.value) })}
                placeholder="50000"
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 38px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(198, 116, 68, 0.35)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "#e59b6e", marginBottom: "6px" }}>
              Password
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Lock size={16} style={{ position: "absolute", left: "12px", color: "#e59b6e" }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Update password"
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 38px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(198, 116, 68, 0.35)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 18px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.08)",
                color: "#dfc7b5",
                border: "1px solid rgba(198, 116, 68, 0.3)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #b86a3c, #8c4c28)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Save size={15} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
