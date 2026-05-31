import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, CheckCircle, Users, Loader2 } from "lucide-react";
import Button from "../components/ButtonComponent";
import Input from "../components/InputComponent";
import { login as loginManager } from "../api/auth";
import { useAuth } from "../context/AuthContext";

// ─── Desktop left panel ───────────────────────────────────────────────────────

const LeftPanel = () => (
  <div className="hidden md:flex flex-col justify-center bg-[#0c1220] px-16 py-20">
    <div className="w-12 h-12 bg-blue-d rounded-2xl flex items-center justify-center mb-6">
      <Lock size={20} className="text-white" />
    </div>
    <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">ShiftEasy</h2>
    <p className="text-sm text-slate-400 leading-relaxed mb-10 max-w-65">
      Construction shift tracking. Managers run everything from here.
    </p>

    <div className="flex flex-col gap-5 mb-10">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-xl bg-[#071e12] flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle size={14} className="text-green" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">Live timesheets</p>
          <p className="text-xs text-slate-500 mt-0.5">See all shifts across all projects</p>
        </div>
      </div>
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-xl bg-[#071830] flex items-center justify-center shrink-0 mt-0.5">
          <Users size={14} className="text-blue" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">Add workers</p>
          <p className="text-xs text-slate-500 mt-0.5">Register workers, send invite links</p>
        </div>
      </div>
    </div>

    <div className="flex items-start gap-3 bg-green-d border border-green-border rounded-xl px-4 py-3">
      <Lock size={12} className="text-green-400 shrink-0 mt-0.5" />
      <p className="text-xs text-green-400 leading-relaxed">
        Workers sign in from mobile only. This page is for managers.
      </p>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ManagerLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const managerLogin = async () => {
    setLoading(true);
    setError("");
    setSlowHint(false);
    slowTimer.current = setTimeout(() => setSlowHint(true), 4000);
    try {
      const res = await loginManager({ email, password });
      if (res.data.role !== "manager") {
        setError("This is the manager login. Your account is a worker account — please use the worker sign in page.");
        return;
      }
      login({ name: res.data.name, role: res.data.role }, res.data.token);
      navigate("/manager/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Wrong email or password. Please try again.");
    } finally {
      setLoading(false);
      setSlowHint(false);
      if (slowTimer.current) clearTimeout(slowTimer.current);
    }
  };

  useEffect(() => () => { if (slowTimer.current) clearTimeout(slowTimer.current); }, []);

  return (
    <div className="min-h-screen bg-bg md:grid md:grid-cols-2">

        <LeftPanel />

        {/* Right panel */}
        <div className="flex flex-col justify-center min-h-screen px-6 py-12 md:px-16">
          <div className="w-full max-w-sm mx-auto">

          {/* Tabs */}
          <div className="flex gap-1 bg-bg3 rounded-xl p-1 mb-8">
            <button className="flex-1 py-2.5 rounded-lg bg-bg2 border border-border text-sm font-semibold text-text shadow-sm">
              Sign in
            </button>
            <button
              onClick={() => navigate("/register")}
              className="flex-1 py-2.5 rounded-lg border border-transparent text-sm font-semibold text-text3 hover:text-text transition-colors"
            >
              Create account
            </button>
          </div>

          <div className="mb-7">
            <h3 className="text-2xl font-bold text-text tracking-tight">Welcome back</h3>
            <p className="text-sm text-text2 mt-1">Sign in to your manager account</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email) { setError("Email is required"); return; }
              if (!password || password.length < 8) { setError("Password must be at least 8 characters"); return; }
              managerLogin();
            }}
            className="flex flex-col gap-5"
          >
            <Input type="email" label="Email address" value={email} onChange={setEmail} placeholder="mart@ehituse.ee" />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-text2">Password</label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs text-blue hover:opacity-70 transition-opacity"
                >
                  Forgot?
                </button>
              </div>
              <Input type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            </div>

            {error && <p className="text-xs text-red">{error}</p>}
            {slowHint && !error && (
              <p className="text-xs text-text3 text-center">
                Server is waking up, hang tight…
              </p>
            )}

            <Button
              label={loading ? "Signing in…" : "Sign in to dashboard"}
              icon={loading ? <Loader2 size={14} className="animate-spin" /> : undefined}
              iconSide="left"
              color="bg-blue"
              type="submit"
              disabled={loading}
            />

            <p className="text-sm text-text3 text-center">
              No account?{" "}
              <span
                className="text-blue cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => navigate("/register")}
              >
                Create one →
              </span>
            </p>
          </form>
          </div>
        </div>
    </div>
  );
};

export default ManagerLoginPage;
