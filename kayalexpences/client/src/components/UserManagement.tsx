import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Users, UserPlus, Shield, Mail, Phone, MapPin, DollarSign, Key, Lock, Eye, EyeOff, Search, UserCheck, Trash2, Edit3, Calendar, X } from "lucide-react";

export interface UserRecord {
  id: string;
  email: string;
  backupEmail?: string;
  mobileNumber?: string;
  place?: string;
  monthlySalary: number;
  role: "Admin" | "User";
  createdAt: string;
}

export const USERS_LIST_KEY = "kayal_users_list";
export const PROFILE_KEY = "kayal_user_profile";
export const CREATE_USER_WORD = "hogwarts-expectopatronum";

export function getUsersList(): UserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }

  // Initial seed from active profile or default
  const activeProfileRaw = localStorage.getItem(PROFILE_KEY);
  let initialEmail = "kayalvizhiintn@gmail.com";
  let backupEmail = "";
  let mobileNumber = "";
  let place = "";
  let monthlySalary = 0;

  if (activeProfileRaw) {
    try {
      const p = JSON.parse(activeProfileRaw);
      if (p.email) initialEmail = p.email;
      if (p.backupEmail) backupEmail = p.backupEmail;
      if (p.mobileNumber) mobileNumber = p.mobileNumber;
      if (p.place) place = p.place;
      if (p.monthlySalary) monthlySalary = p.monthlySalary;
    } catch {}
  }

  const initialList: UserRecord[] = [
    {
      id: "usr_admin_default",
      email: initialEmail,
      backupEmail,
      mobileNumber,
      place,
      monthlySalary,
      role: "Admin",
      createdAt: new Date().toISOString()
    }
  ];

  localStorage.setItem(USERS_LIST_KEY, JSON.stringify(initialList));
  return initialList;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>(getUsersList);
  const [search, setSearch] = useState("");
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // Add User Form State
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newBackupEmail, setNewBackupEmail] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newPlace, setNewPlace] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [newRole, setNewRole] = useState<"Admin" | "User">("User");
  const [secretWord, setSecretWord] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Edit User Form State
  const [editEmail, setEditEmail] = useState("");
  const [editBackupEmail, setEditBackupEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editPlace, setEditPlace] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [editRole, setEditRole] = useState<"Admin" | "User">("User");

  useEffect(() => {
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
  }, [users]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEmail.trim() || !newEmail.includes("@")) {
      toast.error("Please enter a valid Primary Email address.");
      return;
    }
    if (newPassword.trim().length < 4) {
      toast.error("Password must be at least 4 characters long.");
      return;
    }
    if (newBackupEmail.trim() && !newBackupEmail.includes("@")) {
      toast.error("Please enter a valid Backup Email address.");
      return;
    }
    if (secretWord.trim() !== CREATE_USER_WORD) {
      toast.error("Invalid Create User Word! Access denied.");
      return;
    }

    // Check duplicate
    if (users.some(u => u.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      toast.error("A user with this email address already exists.");
      return;
    }

    const newUser: UserRecord = {
      id: crypto.randomUUID(),
      email: newEmail.trim().toLowerCase(),
      backupEmail: newBackupEmail.trim().toLowerCase(),
      mobileNumber: newMobile.trim(),
      place: newPlace.trim(),
      monthlySalary: Number(newSalary) || 0,
      role: newRole,
      createdAt: new Date().toISOString()
    };

    const updated = [newUser, ...users];
    setUsers(updated);
    toast.success(`User ${newUser.email} added successfully!`);

    // Reset Form
    setNewEmail("");
    setNewPassword("");
    setNewBackupEmail("");
    setNewMobile("");
    setNewPlace("");
    setNewSalary("");
    setSecretWord("");
    setAddUserOpen(false);
  };

  const openEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setEditEmail(u.email);
    setEditBackupEmail(u.backupEmail || "");
    setEditMobile(u.mobileNumber || "");
    setEditPlace(u.place || "");
    setEditSalary(u.monthlySalary ? String(u.monthlySalary) : "");
    setEditRole(u.role);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editEmail.trim() || !editEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          email: editEmail.trim().toLowerCase(),
          backupEmail: editBackupEmail.trim().toLowerCase(),
          mobileNumber: editMobile.trim(),
          place: editPlace.trim(),
          monthlySalary: Number(editSalary) || 0,
          role: editRole
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    toast.success(`User details for ${editEmail} updated!`);
    setEditingUser(null);
  };

  const handleDeleteUser = (id: string, email: string) => {
    if (users.length <= 1) {
      toast.error("Cannot delete the only registered user account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user account "${email}"?`)) {
      return;
    }
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    toast.success(`User ${email} deleted.`);
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.place && u.place.toLowerCase().includes(search.toLowerCase())) ||
    (u.mobileNumber && u.mobileNumber.includes(search))
  );

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === "Admin").length;

  const moneyFormat = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  const lightBlurBackdropStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(250, 242, 232, 0.45)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px"
  };

  const lightModalCardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "500px",
    background: "linear-gradient(135deg, rgba(26, 15, 10, 0.96), rgba(16, 9, 6, 0.98))",
    border: "1.5px solid rgba(198, 116, 68, 0.45)",
    borderRadius: "22px",
    padding: "26px 24px",
    color: "#ffffff",
    boxShadow: "0 25px 65px rgba(0, 0, 0, 0.75)",
    maxHeight: "90vh",
    overflowY: "auto",
    boxSizing: "border-box"
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
    boxSizing: "border-box"
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".08em",
    color: "#e59b6e",
    marginBottom: "5px"
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
          gap: "16px"
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
            boxShadow: "0 8px 20px rgba(184, 106, 60, 0.35)"
          }}
        >
          <UserPlus size={18} /> Add New User
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div style={{ background: "linear-gradient(135deg, rgba(26, 15, 10, 0.85), rgba(16, 9, 6, 0.9))", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(198, 116, 68, 0.35)", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 14px 35px rgba(0,0,0,0.45)" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #b86a3c, #8c4c28)", display: "grid", placeItems: "center", color: "#fff", boxShadow: "0 4px 12px rgba(184, 106, 60, 0.3)" }}>
            <Users size={22} />
          </div>
          <div>
            <small style={{ color: "#d6beae", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Total Accounts</small>
            <strong style={{ display: "block", fontSize: "1.5rem", color: "#ffffff", fontWeight: 800 }}>{totalUsers}</strong>
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg, rgba(26, 15, 10, 0.85), rgba(16, 9, 6, 0.9))", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(198, 116, 68, 0.35)", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 14px 35px rgba(0,0,0,0.45)" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #3a603c, #264227)", display: "grid", placeItems: "center", color: "#fff", boxShadow: "0 4px 12px rgba(58, 96, 60, 0.3)" }}>
            <Shield size={22} />
          </div>
          <div>
            <small style={{ color: "#d6beae", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Admins</small>
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
          padding: "24px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
          <div className="searchbox" style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(198, 116, 68, 0.35)", borderRadius: "10px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", minWidth: "260px" }}>
            <Search size={16} style={{ color: "#dfc7b5" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email, place or phone"
              style={{ background: "transparent", border: "none", outline: "none", color: "#ffffff", fontSize: "13px", width: "100%" }}
            />
          </div>
        </div>

        <div className="table-wrap" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", minWidth: "680px", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(198, 116, 68, 0.35)", color: "#e59b6e", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".08em" }}>
                <th style={{ padding: "10px" }}>User Email</th>
                <th style={{ padding: "10px" }}>Role</th>
                <th style={{ padding: "10px" }}>Location</th>
                <th style={{ padding: "10px" }}>Mobile Number</th>
                <th style={{ padding: "10px" }}>Monthly Salary</th>
                <th style={{ padding: "10px" }}>Created Date</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <td style={{ padding: "12px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #b86a3c, #8c4c28)",
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: "14px",
                          display: "grid",
                          placeItems: "center"
                        }}
                      >
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ color: "#ffffff", display: "block" }}>{u.email}</strong>
                        {u.backupEmail && <small style={{ color: "#dfc7b5", fontSize: "11px" }}>Backup: {u.backupEmail}</small>}
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
                        color: u.role === "Admin" ? "#f5d0b5" : "#dfc7b5"
                      }}
                    >
                      <Shield size={12} /> {u.role}
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
                    {u.mobileNumber ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Phone size={13} style={{ color: "#b86a3c" }} /> {u.mobileNumber}
                      </span>
                    ) : (
                      <em style={{ color: "#aa9789" }}>Not specified</em>
                    )}
                  </td>
                  <td style={{ padding: "12px 10px", fontWeight: 700, color: "#ffffff" }}>
                    {u.monthlySalary > 0 ? moneyFormat(u.monthlySalary) : <em style={{ color: "#a88c78", fontWeight: "normal" }}>₹0</em>}
                  </td>
                  <td style={{ padding: "12px 10px", color: "#dfc7b5", fontSize: "12px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={12} /> {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td style={{ padding: "12px 10px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <button
                        onClick={() => openEditModal(u)}
                        style={{
                          background: "rgba(184, 106, 60, 0.12)",
                          border: "1px solid rgba(184, 106, 60, 0.3)",
                          color: "#b86a3c",
                          borderRadius: "8px",
                          padding: "6px 9px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          fontWeight: 600
                        }}
                        title="Edit User"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        style={{
                          background: "rgba(184, 60, 60, 0.1)",
                          border: "1px solid rgba(184, 60, 60, 0.25)",
                          color: "#b83c3c",
                          borderRadius: "8px",
                          padding: "6px 9px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          fontWeight: 600
                        }}
                        title="Delete User"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal - Light Blur Backdrop */}
      {addUserOpen && (
        <div style={lightBlurBackdropStyle}>
          <div style={lightModalCardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #b86a3c, #8c4c28)", display: "grid", placeItems: "center", color: "#fff" }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.25rem", margin: 0, color: "#2b1a12" }}>Create New User Account</h3>
                  <span style={{ fontSize: "12px", color: "#8d7b6e" }}>Add workspace user & credentials</span>
                </div>
              </div>
              <button
                onClick={() => setAddUserOpen(false)}
                style={{ background: "rgba(0,0,0,0.05)", border: "none", color: "#8d7b6e", borderRadius: "8px", padding: "6px", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser} style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "left" }}>
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
                    style={{ ...inputStyle, paddingLeft: "38px" }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>Password *</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Lock size={16} style={{ position: "absolute", left: "12px", color: "#b86a3c" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingLeft: "38px", paddingRight: "38px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: "10px", background: "transparent", border: "none", color: "#8d7b6e", cursor: "pointer" }}
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
                    style={inputStyle}
                  />
                </div>

                {/* Role */}
                <div>
                  <label style={labelStyle}>Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as "Admin" | "User")}
                    style={inputStyle}
                  >
                    <option value="User" style={{ background: "#1a0f0a", color: "#ffffff" }}>User</option>
                    <option value="Admin" style={{ background: "#1a0f0a", color: "#ffffff" }}>Admin</option>
                  </select>
                </div>
              </div>

              {/* Create User Word */}
              <div>
                <label style={{ ...labelStyle, color: "#b86a3c" }}>Create User Word *</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Key size={16} style={{ position: "absolute", left: "12px", color: "#b86a3c" }} />
                  <input
                    type="password"
                    value={secretWord}
                    onChange={(e) => setSecretWord(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingLeft: "38px", borderColor: "rgba(184, 106, 60, 0.6)" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setAddUserOpen(false)}
                  style={{ padding: "9px 18px", borderRadius: "10px", background: "rgba(0, 0, 0, 0.05)", color: "#6e5440", border: "1px solid rgba(0, 0, 0, 0.1)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "9px 20px", borderRadius: "10px", background: "linear-gradient(135deg, #b86a3c, #8c4c28)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px", boxShadow: "0 6px 16px rgba(184, 106, 60, 0.3)" }}
                >
                  <UserPlus size={15} /> Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal - Light Blur Backdrop */}
      {editingUser && (
        <div style={lightBlurBackdropStyle}>
          <div style={lightModalCardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #b86a3c, #8c4c28)", display: "grid", placeItems: "center", color: "#fff" }}>
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.25rem", margin: 0, color: "#2b1a12" }}>Edit User Details</h3>
                  <span style={{ fontSize: "12px", color: "#8d7b6e" }}>{editingUser.email}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                style={{ background: "rgba(0,0,0,0.05)", border: "none", color: "#8d7b6e", borderRadius: "8px", padding: "6px", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "left" }}>
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
                    style={inputStyle}
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
                  style={{ padding: "9px 18px", borderRadius: "10px", background: "rgba(0, 0, 0, 0.05)", color: "#6e5440", border: "1px solid rgba(0, 0, 0, 0.1)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "9px 20px", borderRadius: "10px", background: "linear-gradient(135deg, #b86a3c, #8c4c28)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px", boxShadow: "0 6px 16px rgba(184, 106, 60, 0.3)" }}
                >
                  <Edit3 size={15} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
