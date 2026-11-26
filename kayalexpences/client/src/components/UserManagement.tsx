import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  MapPin,
  Key,
  Lock,
  Eye,
  EyeOff,
  Search,
  Trash2,
  Edit3,
  Calendar,
  X,
  RefreshCw,
  User as UserIcon,
} from "lucide-react";
import { userService, authService } from "../services";

export interface UserRecord {
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  password?: string;
  backupEmail?: string;
  mobileNumber?: string;
  mobile?: string;
  place?: string;
  monthlySalary: number;
  salary?: number;
  role: "Admin" | "User";
  createdAt: string;
}

export const USERS_LIST_KEY = "kayal_users_list";
export const PROFILE_KEY = "kayal_user_profile";
export const CREATE_USER_WORD = "hogwarts-expectopatronum";

function generateSafeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback
    }
  }
  return "usr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
}

export function getUsersList(): UserRecord[] {
  let list: UserRecord[] = [];
  try {
    const raw = localStorage.getItem(USERS_LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed
          .map((u: any, idx: number) => ({
            id: String(u.id || `usr_${idx}_${Date.now()}`),
            name: u.fullName || u.name || "",
            fullName: u.fullName || u.name || "",
            email: String(u.email || "").trim().toLowerCase(),
            password: u.password || "",
            backupEmail: u.backupEmail ? String(u.backupEmail).trim().toLowerCase() : "",
            mobileNumber: String(u.mobileNumber || u.mobile || "").trim(),
            place: u.place ? String(u.place).trim() : "",
            monthlySalary: Number(u.monthlySalary ?? u.salary ?? 0) || 0,
            role: (u.role === "Admin" ? "Admin" : "User") as "Admin" | "User",
            createdAt: u.createdAt || new Date().toISOString(),
          }))
          .filter((u) => u.email.length > 0);
      }
    }
  } catch (err) {
    console.error("Error reading users list from localStorage:", err);
  }

  // Seed default admin if empty
  if (list.length === 0) {
    const activeProfileRaw = localStorage.getItem(PROFILE_KEY);
    let initialEmail = localStorage.getItem("kayal_user_email") || "kayalvizhiintn@gmail.com";
    let backupEmail = "";
    let mobileNumber = "";
    let place = "";
    let monthlySalary = 0;

    if (activeProfileRaw) {
      try {
        const p = JSON.parse(activeProfileRaw);
        if (p.email) initialEmail = p.email;
        if (p.backupEmail) backupEmail = p.backupEmail;
        if (p.mobileNumber || p.mobile) mobileNumber = String(p.mobileNumber || p.mobile);
        if (p.place) place = p.place;
        if (p.monthlySalary || p.salary) monthlySalary = Number(p.monthlySalary || p.salary) || 0;
      } catch {
        // ignore JSON parse error
      }
    }

    const defaultAdmin: UserRecord = {
      id: "usr_admin_default",
      name: "Admin User",
      fullName: "Admin User",
      email: initialEmail.trim().toLowerCase(),
      password: localStorage.getItem("kayal_user_password") || "baliedinburgh",
      backupEmail,
      mobileNumber,
      place,
      monthlySalary,
      role: "Admin",
      createdAt: new Date().toISOString(),
    };

    list = [defaultAdmin];
    try {
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  return list;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>(getUsersList);
  const [search, setSearch] = useState("");
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add User Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newBackupEmail, setNewBackupEmail] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newPlace, setNewPlace] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [newRole, setNewRole] = useState<"Admin" | "User">("User");
  const [secretWord, setSecretWord] = useState(CREATE_USER_WORD);
  const [showPassword, setShowPassword] = useState(false);

  // Edit User Form State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBackupEmail, setEditBackupEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editPlace, setEditPlace] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [editRole, setEditRole] = useState<"Admin" | "User">("User");

  // Sync users to localStorage whenever users state changes
  useEffect(() => {
    try {
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn("Could not save users list to localStorage:", e);
    }
  }, [users]);

  // Fetch users from backend on mount (merge with localStorage)
  const fetchBackendUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const backendUsers = await userService.getAll();
      if (Array.isArray(backendUsers) && backendUsers.length > 0) {
        setUsers((prev) => {
          const map = new Map<string, UserRecord>();
          // Add local users first
          prev.forEach((u) => {
            if (u.email) map.set(u.email.toLowerCase(), u);
          });
          // Merge or override with backend users
          backendUsers.forEach((bu) => {
            const emailKey = bu.email.toLowerCase();
            const existing = map.get(emailKey);
            map.set(emailKey, {
              id: bu.id || existing?.id || generateSafeId(),
              name: bu.fullName || existing?.name || "",
              fullName: bu.fullName || existing?.fullName || "",
              email: bu.email.toLowerCase(),
              password: existing?.password || "",
              backupEmail: bu.backupEmail || existing?.backupEmail || "",
              mobileNumber: bu.mobileNumber || existing?.mobileNumber || "",
              place: bu.place || existing?.place || "",
              monthlySalary: bu.monthlySalary || existing?.monthlySalary || 0,
              role: (bu.role === "Admin" ? "Admin" : "User") as "Admin" | "User",
              createdAt: bu.createdAt || existing?.createdAt || new Date().toISOString(),
            });
          });
          return Array.from(map.values());
        });
      }
    } catch {
      // Backend offline or unauthenticated; fallback quietly to local state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackendUsers();
  }, [fetchBackendUsers]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEmail.trim() || !newEmail.includes("@")) {
      toast.error("Please enter a valid Primary Email address.");
      return;
    }
    if (newPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (newBackupEmail.trim() && !newBackupEmail.includes("@")) {
      toast.error("Please enter a valid Backup Email address.");
      return;
    }
    if (secretWord.trim() !== CREATE_USER_WORD) {
      toast.error("Invalid Secret Word! (Default: hogwarts-expectopatronum)");
      return;
    }

    // Check duplicate
    if (users.some((u) => u.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      toast.error("A user with this email address already exists.");
      return;
    }

    setIsSubmitting(true);
    let createdId = generateSafeId();

    // 1. Try to register on backend database if reachable
    try {
      const registered = await authService.register({
        email: newEmail.trim().toLowerCase(),
        password: newPassword.trim(),
        fullName: newName.trim() || newEmail.split("@")[0],
        backupEmail: newBackupEmail.trim().toLowerCase() || undefined,
        mobileNumber: newMobile.trim() || undefined,
        place: newPlace.trim() || undefined,
        monthlySalary: Number(newSalary) || 0,
        role: newRole,
      });
      if (registered?.id) {
        createdId = registered.id;
      }
    } catch {
      // If backend fails or offline, continue with local storage save
    }

    const newUser: UserRecord = {
      id: createdId,
      name: newName.trim() || newEmail.split("@")[0],
      fullName: newName.trim() || newEmail.split("@")[0],
      email: newEmail.trim().toLowerCase(),
      password: newPassword.trim(),
      backupEmail: newBackupEmail.trim().toLowerCase(),
      mobileNumber: newMobile.trim(),
      place: newPlace.trim(),
      monthlySalary: Number(newSalary) || 0,
      role: newRole,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);
    toast.success(`User ${newUser.email} added successfully!`);

    // Reset Form
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewBackupEmail("");
    setNewMobile("");
    setNewPlace("");
    setNewSalary("");
    setNewRole("User");
    setSecretWord(CREATE_USER_WORD);
    setAddUserOpen(false);
    setIsSubmitting(false);
  };

  const openEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setEditName(u.fullName || u.name || "");
    setEditEmail(u.email);
    setEditBackupEmail(u.backupEmail || "");
    setEditMobile(u.mobileNumber || u.mobile || "");
    setEditPlace(u.place || "");
    setEditSalary(u.monthlySalary ? String(u.monthlySalary) : "");
    setEditRole(u.role || "User");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editEmail.trim() || !editEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    // Try backend update if user ID looks like a valid GUID
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingUser.id);
    if (isGuid) {
      try {
        await userService.update(editingUser.id, {
          fullName: editName.trim() || undefined,
          backupEmail: editBackupEmail.trim().toLowerCase() || undefined,
          mobileNumber: editMobile.trim() || undefined,
          place: editPlace.trim() || undefined,
          monthlySalary: Number(editSalary) || 0,
          role: editRole,
        });
      } catch {
        // Continue with local update
      }
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            name: editName.trim(),
            fullName: editName.trim(),
            email: editEmail.trim().toLowerCase(),
            backupEmail: editBackupEmail.trim().toLowerCase(),
            mobileNumber: editMobile.trim(),
            place: editPlace.trim(),
            monthlySalary: Number(editSalary) || 0,
            role: editRole,
          };
        }
        return u;
      })
    );

    toast.success(`User details for ${editEmail} updated!`);
    setEditingUser(null);
    setIsSubmitting(false);
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (users.length <= 1) {
      toast.error("Cannot delete the only registered user account.");
      return;
    }

    const currentLoggedIn = localStorage.getItem("kayal_user_email") || "";
    if (currentLoggedIn && currentLoggedIn.toLowerCase() === email.toLowerCase()) {
      if (!window.confirm(`Warning: "${email}" is your currently active session account. Are you sure you want to delete it?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete user account "${email}"?`)) {
        return;
      }
    }

    // Try backend delete if it's a GUID
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isGuid) {
      try {
        await userService.delete(id);
      } catch {
        // Continue with local delete
      }
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success(`User ${email} deleted.`);
  };

  // Safe search filter preventing runtime errors on undefined/null fields
  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const email = (u.email || "").toLowerCase();
    const name = (u.fullName || u.name || "").toLowerCase();
    const place = (u.place || "").toLowerCase();
    const mobile = String(u.mobileNumber || u.mobile || "");
    const role = (u.role || "").toLowerCase();
    return (
      email.includes(q) ||
      name.includes(q) ||
      place.includes(q) ||
      mobile.includes(q) ||
      role.includes(q)
    );
  });

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "Admin").length;

  const moneyFormat = (val: number) => {
    if (isNaN(val) || val === null || val === undefined) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.max(0, val));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
  };

  const lightBlurBackdropStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(10, 5, 3, 0.7)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  };

  const lightModalCardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "520px",
    background: "linear-gradient(135deg, rgba(28, 16, 11, 0.98), rgba(18, 10, 7, 0.99))",
    border: "1.5px solid rgba(198, 116, 68, 0.5)",
    borderRadius: "22px",
    padding: "26px 24px",
    color: "#ffffff",
    boxShadow: "0 25px 65px rgba(0, 0, 0, 0.85)",
    maxHeight: "90vh",
    overflowY: "auto",
    boxSizing: "border-box",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(198, 116, 68, 0.35)",
    borderRadius: "10px",
    color: "#ffffff",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".08em",
    color: "#e59b6e",
    marginBottom: "5px",
  };

  return (
    <section className="user-management-page anim-fade-up" style={{ paddingBottom: "40px" }}>
      {/* Intro Header */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(26, 15, 10, 0.85), rgba(16, 9, 6, 0.9))",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "24px 28px",
          borderRadius: "18px",
          border: "1px solid rgba(198, 116, 68, 0.35)",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <p className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#e59b6e", margin: 0 }}>
            <Users size={15} /> User Management & Profiles
          </p>
          <h2 style={{ fontSize: "1.6rem", margin: "4px 0 0", color: "#ffffff", fontWeight: 800 }}>
            Registered Users ({totalUsers})
          </h2>
          <span style={{ fontSize: "13px", color: "#dfc7b5" }}>
            Manage workspace member profiles, credentials, and access roles.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={fetchBackendUsers}
            disabled={isLoading}
            title="Refresh users from database"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "12px 16px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(198, 116, 68, 0.35)",
              color: "#dfc7b5",
              fontWeight: 600,
              fontSize: "13px",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Syncing..." : "Refresh"}
          </button>

          <button
            className="button primary"
            onClick={() => setAddUserOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #b86a3c 0%, #8c4c28 100%)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(184, 106, 60, 0.35)",
            }}
          >
            <UserPlus size={18} /> Add New User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(26, 15, 10, 0.85), rgba(16, 9, 6, 0.9))",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(198, 116, 68, 0.35)",
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 14px 35px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #b86a3c, #8c4c28)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(184, 106, 60, 0.3)",
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <small style={{ color: "#d6beae", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>
              Total Accounts
            </small>
            <strong style={{ display: "block", fontSize: "1.5rem", color: "#ffffff", fontWeight: 800 }}>{totalUsers}</strong>
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, rgba(26, 15, 10, 0.85), rgba(16, 9, 6, 0.9))",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(198, 116, 68, 0.35)",
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 14px 35px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #3a603c, #264227)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(58, 96, 60, 0.3)",
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <small style={{ color: "#d6beae", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>
              Admins
            </small>
            <strong style={{ display: "block", fontSize: "1.5rem", color: "#86efac", fontWeight: 800 }}>{adminCount}</strong>
          </div>
        </div>
      </div>

      {/* Users Table Panel */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(26, 15, 10, 0.88), rgba(16, 9, 6, 0.94))",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: "18px",
          border: "1px solid rgba(198, 116, 68, 0.35)",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
          padding: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
          <div
            className="searchbox"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(198, 116, 68, 0.35)",
              borderRadius: "10px",
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minWidth: "260px",
            }}
          >
            <Search size={16} style={{ color: "#dfc7b5" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email, name, city or phone..."
              style={{ background: "transparent", border: "none", outline: "none", color: "#ffffff", fontSize: "13px", width: "100%" }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ background: "transparent", border: "none", color: "#dfc7b5", cursor: "pointer", padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="table-wrap" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", minWidth: "680px", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(198, 116, 68, 0.35)", color: "#e59b6e", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".08em" }}>
                <th style={{ padding: "10px" }}>User Profile</th>
                <th style={{ padding: "10px" }}>Role</th>
                <th style={{ padding: "10px" }}>Location</th>
                <th style={{ padding: "10px" }}>Mobile Number</th>
                <th style={{ padding: "10px" }}>Monthly Salary</th>
                <th style={{ padding: "10px" }}>Created Date</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px 10px", color: "#dfc7b5" }}>
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const initialLetter = (u.email || "U").charAt(0).toUpperCase();
                  const displayName = u.fullName || u.name;

                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "10px",
                              background: u.role === "Admin" ? "linear-gradient(135deg, #b86a3c, #8c4c28)" : "linear-gradient(135deg, #44352a, #2a1f18)",
                              color: "#fff",
                              fontWeight: 800,
                              fontSize: "14px",
                              display: "grid",
                              placeItems: "center",
                              border: "1px solid rgba(198, 116, 68, 0.4)",
                            }}
                          >
                            {initialLetter}
                          </div>
                          <div>
                            {displayName && <strong style={{ color: "#ffffff", display: "block" }}>{displayName}</strong>}
                            <span style={{ color: displayName ? "#dfc7b5" : "#ffffff", fontWeight: displayName ? "normal" : "bold", fontSize: displayName ? "12px" : "13px", display: "block" }}>
                              {u.email}
                            </span>
                            {u.backupEmail && <small style={{ color: "#a88c78", fontSize: "11px" }}>Backup: {u.backupEmail}</small>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 800,
                            background: u.role === "Admin" ? "rgba(184, 106, 60, 0.25)" : "rgba(255,255,255,0.08)",
                            color: u.role === "Admin" ? "#f5d0b5" : "#dfc7b5",
                            border: u.role === "Admin" ? "1px solid rgba(198, 116, 68, 0.4)" : "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <Shield size={12} /> {u.role || "User"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px", color: "#dfc7b5" }}>
                        {u.place ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <MapPin size={13} style={{ color: "#e59b6e" }} /> {u.place}
                          </span>
                        ) : (
                          <em style={{ color: "#a88c78" }}>Not specified</em>
                        )}
                      </td>
                      <td style={{ padding: "12px 10px", color: "#dfc7b5" }}>
                        {u.mobileNumber || u.mobile ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Phone size={13} style={{ color: "#b86a3c" }} /> {u.mobileNumber || u.mobile}
                          </span>
                        ) : (
                          <em style={{ color: "#aa9789" }}>Not specified</em>
                        )}
                      </td>
                      <td style={{ padding: "12px 10px", fontWeight: 700, color: "#ffffff" }}>
                        {moneyFormat(u.monthlySalary)}
                      </td>
                      <td style={{ padding: "12px 10px", color: "#dfc7b5", fontSize: "12px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={12} /> {formatDate(u.createdAt)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            onClick={() => openEditModal(u)}
                            style={{
                              background: "rgba(184, 106, 60, 0.15)",
                              border: "1px solid rgba(184, 106, 60, 0.4)",
                              color: "#f5d0b5",
                              borderRadius: "8px",
                              padding: "6px 10px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                            title="Edit User"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            style={{
                              background: "rgba(220, 38, 38, 0.15)",
                              border: "1px solid rgba(220, 38, 38, 0.4)",
                              color: "#fca5a5",
                              borderRadius: "8px",
                              padding: "6px 10px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                            title="Delete User"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {addUserOpen && (
        <div style={lightBlurBackdropStyle}>
          <div style={lightModalCardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #b86a3c, #8c4c28)", display: "grid", placeItems: "center", color: "#fff" }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.25rem", margin: 0, color: "#ffffff", fontWeight: 700 }}>Create New User Account</h3>
                  <span style={{ fontSize: "12px", color: "#dfc7b5" }}>Add workspace user & credentials</span>
                </div>
              </div>
              <button
                onClick={() => setAddUserOpen(false)}
                style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#dfc7b5", borderRadius: "8px", padding: "6px", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser} style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "left" }}>
              {/* Full Name */}
              <div>
                <label style={labelStyle}>Full Name</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <UserIcon size={16} style={{ position: "absolute", left: "12px", color: "#b86a3c" }} />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Kayalvizhi R"
                    style={{ ...inputStyle, paddingLeft: "38px" }}
                  />
                </div>
              </div>

              {/* Primary Email */}
              <div>
                <label style={labelStyle}>Email Address *</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Mail size={16} style={{ position: "absolute", left: "12px", color: "#b86a3c" }} />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    style={{ ...inputStyle, paddingLeft: "38px" }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>Password (min 6 characters) *</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Lock size={16} style={{ position: "absolute", left: "12px", color: "#b86a3c" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Enter password..."
                    style={{ ...inputStyle, paddingLeft: "38px", paddingRight: "38px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: "10px", background: "transparent", border: "none", color: "#dfc7b5", cursor: "pointer" }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Backup Email */}
              <div>
                <label style={labelStyle}>Backup Email ID</label>
                <input
                  type="email"
                  value={newBackupEmail}
                  onChange={(e) => setNewBackupEmail(e.target.value)}
                  placeholder="alternate@gmail.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                {/* Mobile */}
                <div>
                  <label style={labelStyle}>Mobile Number</label>
                  <input
                    type="tel"
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    placeholder="9876543210"
                    style={inputStyle}
                  />
                </div>

                {/* Place */}
                <div>
                  <label style={labelStyle}>Place / City</label>
                  <input
                    type="text"
                    value={newPlace}
                    onChange={(e) => setNewPlace(e.target.value)}
                    placeholder="Chennai"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                {/* Monthly Salary */}
                <div>
                  <label style={labelStyle}>Monthly Salary (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    placeholder="50000"
                    style={inputStyle}
                  />
                </div>

                {/* Role */}
                <div>
                  <label style={labelStyle}>Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as "Admin" | "User")}
                    style={{ ...inputStyle, color: "#ffffff", backgroundColor: "#1e120b" }}
                  >
                    <option value="User" style={{ background: "#1a0f0a", color: "#ffffff" }}>User</option>
                    <option value="Admin" style={{ background: "#1a0f0a", color: "#ffffff" }}>Admin</option>
                  </select>
                </div>
              </div>

              {/* Create User Word */}
              <div>
                <label style={{ ...labelStyle, color: "#e59b6e" }}>
                  Create User Word * <span style={{ fontSize: "10px", color: "#a88c78", textTransform: "none" }}>(Default: {CREATE_USER_WORD})</span>
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Key size={16} style={{ position: "absolute", left: "12px", color: "#b86a3c" }} />
                  <input
                    type="password"
                    value={secretWord}
                    onChange={(e) => setSecretWord(e.target.value)}
                    required
                    placeholder={CREATE_USER_WORD}
                    style={{ ...inputStyle, paddingLeft: "38px", borderColor: "rgba(184, 106, 60, 0.6)" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setAddUserOpen(false)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.08)",
                    color: "#dfc7b5",
                    border: "1px solid rgba(198, 116, 68, 0.3)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "9px 20px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #b86a3c, #8c4c28)",
                    color: "#fff",
                    border: "none",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    fontSize: "13px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 6px 16px rgba(184, 106, 60, 0.3)",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  <UserPlus size={15} /> {isSubmitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div style={lightBlurBackdropStyle}>
          <div style={lightModalCardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #b86a3c, #8c4c28)", display: "grid", placeItems: "center", color: "#fff" }}>
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.25rem", margin: 0, color: "#ffffff", fontWeight: 700 }}>Edit User Details</h3>
                  <span style={{ fontSize: "12px", color: "#dfc7b5" }}>{editingUser.email}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#dfc7b5", borderRadius: "8px", padding: "6px", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "left" }}>
              {/* Full Name */}
              <div>
                <label style={labelStyle}>Full Name</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <UserIcon size={16} style={{ position: "absolute", left: "12px", color: "#b86a3c" }} />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: "38px" }}
                  />
                </div>
              </div>

              {/* Primary Email */}
              <div>
                <label style={labelStyle}>Email Address *</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Mail size={16} style={{ position: "absolute", left: "12px", color: "#b86a3c" }} />
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingLeft: "38px" }}
                  />
                </div>
              </div>

              {/* Backup Email */}
              <div>
                <label style={labelStyle}>Backup Email ID</label>
                <input
                  type="email"
                  value={editBackupEmail}
                  onChange={(e) => setEditBackupEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                {/* Mobile */}
                <div>
                  <label style={labelStyle}>Mobile Number</label>
                  <input
                    type="tel"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Place */}
                <div>
                  <label style={labelStyle}>Place / City</label>
                  <input
                    type="text"
                    value={editPlace}
                    onChange={(e) => setEditPlace(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                {/* Monthly Salary */}
                <div>
                  <label style={labelStyle}>Monthly Salary (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editSalary}
                    onChange={(e) => setEditSalary(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Role */}
                <div>
                  <label style={labelStyle}>Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as "Admin" | "User")}
                    style={{ ...inputStyle, color: "#ffffff", backgroundColor: "#1e120b" }}
                  >
                    <option value="User" style={{ background: "#1a0f0a", color: "#ffffff" }}>User</option>
                    <option value="Admin" style={{ background: "#1a0f0a", color: "#ffffff" }}>Admin</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.08)",
                    color: "#dfc7b5",
                    border: "1px solid rgba(198, 116, 68, 0.3)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "9px 20px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #b86a3c, #8c4c28)",
                    color: "#fff",
                    border: "none",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    fontSize: "13px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 6px 16px rgba(184, 106, 60, 0.3)",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  <Edit3 size={15} /> {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
