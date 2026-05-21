import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { getUser, userChangePassword } from "../api/user";
import { useAuth } from "../context/AuthContext";
import NavbarManager from "../components/NavbarManager";
import Loader from "../components/Loader";
import type { UserTypes } from "../types";

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

const PasswordInput = ({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex items-center">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg2 border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text3 outline-none focus:border-blue/50 pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 text-text3 hover:text-text transition-colors"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
};

const ManagerProfilePage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserTypes | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getUser();
        setUser(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchData();
  }, []);

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

  if (!isLoaded) return <Loader />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg px-5 pt-14 pb-24">
      <div className="max-w-sm mx-auto">

        {/* Avatar + name + badge */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green flex items-center justify-center mb-3">
            <span className="text-xl font-bold text-white">
              {getInitials(user.name)}
            </span>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">{user.name}</h2>
          <div className="flex items-center gap-1.5 bg-bg3 border border-border rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green" />
            <span className="text-xs text-text2 font-medium">
              Manager · {user.company?.name ?? "—"}
            </span>
          </div>
        </div>

        {/* Account section */}
        <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-2">
          Account
        </p>
        <div className="bg-bg3 border border-border rounded-2xl mb-5 divide-y divide-border">
          {[
            { label: "Email", value: user.email },
            { label: "Company", value: user.company?.name ?? "—" },
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

        {/* Settings section */}
        <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-2">
          Settings
        </p>
        <div className="bg-bg3 border border-border rounded-2xl mb-5 divide-y divide-border">
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
                <PasswordInput
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                />
                <PasswordInput
                  placeholder="New password"
                  value={newPassword}
                  onChange={setNewPassword}
                />
                <PasswordInput
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
                {pwError && <p className="text-xs text-red">{pwError}</p>}
                {pwSuccess && (
                  <p className="text-xs text-green">Password updated successfully</p>
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
        </div>

        {/* Sign out */}
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="w-full bg-red/15 border border-red/30 rounded-2xl py-4 text-base font-bold text-red"
        >
          Sign out
        </button>
      </div>

      <NavbarManager />
    </div>
  );
};

export default ManagerProfilePage;
