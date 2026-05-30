import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUser, userChangePassword } from "../api/user";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import type { UserTypes } from "../types";
import NavBarWorker from "../components/NavBar";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatMemberSince = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

const WorkerProfilePage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };
  const [notifications, setNotifications] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const { data: user, isLoading: isLoaded } = useQuery<UserTypes>({
    queryKey: ["workerProfile"],
    queryFn: async () => { const res = await getUser(); return res.data; },
    staleTime: 5 * 60_000,
  });

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters");
      return;
    }

    try {
      setPwLoading(true);
      await userChangePassword({ currentPassword, newPassword });
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowChangePassword(false);
        setPwSuccess(false);
      }, 1500);
    } catch (err: any) {
      setPwError(err.response?.data?.message ?? "Something went wrong");
    } finally {
      setPwLoading(false);
    }
  };

  if (isLoaded) return <Loader />;
  if (!user) return null;

  const managerName = user.company?.managers?.[0]?.name ?? null;

  return (
    <div className="min-h-screen bg-bg px-5 pt-14 pb-20">
      <div className="max-w-sm mx-auto">
        {/* ── Avatar + name + badge ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blue flex items-center justify-center mb-3">
            <span className="text-xl font-bold text-white">
              {getInitials(user.name)}
            </span>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">{user.name}</h2>
          <div className="flex items-center gap-1.5 bg-bg3 border border-border rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green" />
            <span className="text-xs text-text2 font-medium">
              Worker · {user.sites?.[0]?.name ?? "No site"}
            </span>
          </div>
        </div>

        {/* ── Account section ── */}
        <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-2">
          Account
        </p>
        <div className="bg-bg3 border border-border rounded-2xl mb-5 divide-y divide-border">
          {[
            { label: "Email", value: user.email },
            { label: "Company", value: user.company?.name ?? "—" },
            { label: "Manager", value: managerName ?? "—" },
            { label: "Member since", value: formatMemberSince(user.createdAt) },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex justify-between items-center px-4 py-3"
            >
              <span className="text-sm text-text3">{label}</span>
              <span className="text-sm font-semibold text-text">{value}</span>
            </div>
          ))}
        </div>

        {/* ── Settings section ── */}
        <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-2">
          Settings
        </p>
        <div className="bg-bg3 border border-border rounded-2xl mb-5 divide-y divide-border">
          {/* Change password row + inline form */}
          <div>
            <button
              onClick={() => {
                setShowChangePassword((prev) => !prev);
                setPwError(null);
                setPwSuccess(false);
              }}
              className="flex justify-between items-center px-4 py-3.5 w-full text-left"
            >
              <span className="text-sm font-semibold text-text">
                Change password
              </span>
              {showChangePassword ? (
                <ChevronDown size={16} className="text-text3" />
              ) : (
                <ChevronRight size={16} className="text-text3" />
              )}
            </button>

            {showChangePassword && (
              <form
                onSubmit={handleChangePassword}
                className="px-4 pb-4 flex flex-col gap-3"
              >
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-bg2 border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text3 outline-none focus:border-blue/50"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-bg2 border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text3 outline-none focus:border-blue/50"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-bg2 border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text3 outline-none focus:border-blue/50"
                />
                {pwError && <p className="text-xs text-red">{pwError}</p>}
                {pwSuccess && (
                  <p className="text-xs text-green">
                    Password updated successfully
                  </p>
                )}
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full bg-blue rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {pwLoading ? "Saving..." : "Save"}
                </button>
              </form>
            )}
          </div>

          {/* Notifications toggle */}
          <div className="flex justify-between items-center px-4 py-3.5">
            <span className="text-sm font-semibold text-text">
              Notifications
            </span>
            <button
              onClick={() => setNotifications((prev) => !prev)}
              className={`w-11 h-6 rounded-full transition-colors ${notifications ? "bg-blue" : "bg-border"}`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${notifications ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
        </div>

        {/* ── Sign out ── */}
        <button
          onClick={handleLogout}
          className="w-full bg-red/15 border border-red/30 rounded-2xl py-4 text-base font-bold text-red"
        >
          Sign out
        </button>
      </div>
      <NavBarWorker />
    </div>
  );
};

export default WorkerProfilePage;
