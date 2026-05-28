import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, User, Star } from "lucide-react";
import Button from "../components/ButtonComponent";
import Input from "../components/InputComponent";
import { register as registerApi, checkEmail as checkEmailApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";

// ─── Desktop left panel ───────────────────────────────────────────────────────

const STEP_LIST = [
  { n: 1, icon: User,        color: "text-blue",      bg: "bg-blue/15",      label: "Your account", desc: "Name, company, email, password" },
  { n: 2, icon: Star,        color: "text-amber-400", bg: "bg-amber-400/15", label: "First project", desc: "Name your first project and location" },
  { n: 3, icon: CheckCircle, color: "text-green",     bg: "bg-green/15",     label: "Done",          desc: "Start adding workers immediately" },
];

const LeftPanel = ({ step }: { step: number }) => {
  if (step === 3) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center bg-[#0c1220] px-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green/10 flex items-center justify-center mb-5">
          <CheckCircle size={32} className="text-green" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">You're all set!</h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-55">
          Company and first site created. Start adding workers from the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="hidden md:flex flex-col justify-center bg-[#0c1220] px-16">
      <div className="w-12 h-12 bg-blue-d rounded-2xl flex items-center justify-center mb-6">
        <span className="text-[11px] font-bold text-white leading-none">SE</span>
      </div>
      <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">ShiftEasy</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-10 max-w-60">
        Set up takes 2 minutes. Fill in your details and create your first construction site.
      </p>

      <div className="flex flex-col gap-2">
        {STEP_LIST.map(({ n, icon: Icon, color, bg, label, desc }) => {
          const active = step === n;
          const done = step > n;
          return (
            <div
              key={n}
              className={`flex items-start gap-3 rounded-xl px-3 py-3 transition-colors ${active ? "bg-white/5" : ""}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                done ? "bg-green/15" : active ? bg : "bg-white/5"
              }`}>
                {done
                  ? <CheckCircle size={14} className="text-green" />
                  : <Icon size={14} className={active ? color : "text-slate-600"} />
                }
              </div>
              <div>
                <p className={`text-sm font-semibold leading-tight ${
                  active ? "text-white" : done ? "text-slate-400" : "text-slate-600"
                }`}>
                  Step {n} — {label}
                </p>
                <p className={`text-xs mt-0.5 ${active ? "text-slate-400" : "text-slate-600"}`}>
                  {desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Step tracker ─────────────────────────────────────────────────────────────

const STEP_LABELS = ["Your account", "First project", "Ready"];

const StepTracker = ({ step }: { step: number }) => (
  <div className="mb-7">
    <div className="flex items-center mb-2.5">
      {[1, 2, 3].map((n, i) => (
        <div key={n} className="flex items-center">
          {/* Dot */}
          <div
            className={`rounded-full transition-all duration-300 ${
              n < step
                ? "w-2.5 h-2.5 bg-green shadow-[0_0_0_3px_rgba(48,209,88,0.15)]"
                : n === step
                  ? "w-3 h-3 bg-blue shadow-[0_0_0_4px_rgba(10,132,255,0.18)]"
                  : "w-2.5 h-2.5 bg-bg3 border border-border"
            }`}
          />
          {/* Connector pill */}
          {i < 2 && (
            <div
              className={`h-1 w-9 mx-1.5 rounded-full transition-all duration-500 ${
                n < step ? "bg-blue" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
    <p className="text-xs text-text3">
      <span className={step === 3 ? "text-green font-semibold" : "text-blue font-semibold"}>
        Step {step} of 3
      </span>
      {" — "}
      {STEP_LABELS[step - 1]}
    </p>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [error2, setError2] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");

  const { login } = useAuth();

  const registration = async () => {
    if (!siteName || siteName.length < 2) { setError2("Site name is required"); return; }
    if (!siteAddress || siteAddress.length < 5) { setError2("Enter a full address"); return; }
    setError2("");
    try {
      const res = await registerApi({ name, companyName: company, email, password, siteName, siteAddress });
      login({ name: res.data.name, role: res.data.role }, res.data.token);
      setStep(3);
    } catch (err: any) {
      setError2(err?.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-bg md:grid md:grid-cols-2">

        <LeftPanel step={step} />

        {/* Right panel */}
        <div className="flex flex-col justify-center min-h-screen px-6 py-12 md:px-16">
          <div className="w-full max-w-sm mx-auto">

          {/* Back — mobile only, steps 1-2 */}
          {step < 3 && (
            <button
              className="md:hidden flex items-center gap-1 mb-8 hover:opacity-70 transition-opacity"
              onClick={() => (step === 1 ? navigate("/") : setStep((s) => s - 1))}
            >
              <span className="text-blue text-sm">← Back</span>
            </button>
          )}

          {/* Tabs — steps 1-2 only */}
          {step < 3 && (
            <div className="flex gap-1 bg-bg3 rounded-xl p-1 mb-8">
              <button
                onClick={() => navigate("/login/manager")}
                className="flex-1 py-2.5 rounded-lg border border-transparent text-sm font-semibold text-text3 hover:text-text transition-colors"
              >
                Sign in
              </button>
              <button className="flex-1 py-2.5 rounded-lg bg-bg2 border border-border text-sm font-semibold text-text shadow-sm">
                Create account
              </button>
            </div>
          )}

          {/* Step tracker — all steps */}
          <StepTracker step={step} />

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <div className="mb-7">
                <h3 className="text-2xl font-bold text-text tracking-tight">Create your account</h3>
                <p className="text-sm text-text2 mt-1">Set up takes 2 minutes</p>
              </div>
              <form
                className="flex flex-col gap-5"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!name || name.length < 2) { setError("Name must be at least 2 characters"); return; }
                  if (!company) { setError("Company name is required"); return; }
                  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address"); return; }
                  if (!password || password.length < 8) { setError("Password must be at least 8 characters"); return; }
                  if (!/\d/.test(password)) { setError("Password must contain at least one number"); return; }
                  setError("");
                  setCheckingEmail(true);
                  try {
                    const res = await checkEmailApi(email);
                    if (!res.available) { setError("An account with this email already exists"); setCheckingEmail(false); return; }
                  } catch {
                    // endpoint unavailable — let registration catch duplicates
                  } finally {
                    setCheckingEmail(false);
                  }
                  setStep(2);
                }}
              >
                <Input type="text" label="Full name" value={name} onChange={setName} placeholder="Mart Tamm" />
                <Input type="text" label="Company name" value={company} onChange={setCompany} placeholder="Ehituse OÜ" />
                <Input type="email" label="Email address" value={email} onChange={setEmail} placeholder="mart@ehituse.ee" />
                <Input type="password" label="Password" value={password} onChange={setPassword} placeholder="••••••••" />
                {error && <p className="text-xs text-red">{error}</p>}
                <Button label={checkingEmail ? "Checking…" : "Continue →"} color="bg-blue" type="submit" disabled={checkingEmail} />
                <p className="text-sm text-text3 text-center">
                  Already have an account?{" "}
                  <span className="text-blue cursor-pointer hover:opacity-70 transition-opacity" onClick={() => navigate("/login/manager")}>
                    Sign in
                  </span>
                </p>
              </form>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <>
              <div className="mb-7">
                <h3 className="text-2xl font-bold text-text tracking-tight">Your first project</h3>
                <p className="text-sm text-text2 mt-1">You can add more projects later from the dashboard</p>
              </div>
              <form
                className="flex flex-col gap-5"
                onSubmit={(e) => { e.preventDefault(); registration(); }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Star size={13} className="text-amber-400" />
                    <p className="text-xs font-semibold text-text3 uppercase tracking-widest">Construction site details</p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <Input type="text" label="Project name" value={siteName} onChange={setSiteName} placeholder="Ülemiste keskuse renoveerimine" />
                    <Input type="text" label="Location / address" value={siteAddress} onChange={setSiteAddress} placeholder="Pärnu mnt 15, Tallinn" />
                  </div>
                </div>
                {error2 && <p className="text-xs text-red">{error2}</p>}
                <Button label="Continue → Step 3" color="bg-green" type="submit" />
                <p className="text-sm text-text3 text-center">
                  Already have an account?{" "}
                  <span className="text-blue cursor-pointer hover:opacity-70 transition-opacity" onClick={() => navigate("/login/manager")}>
                    Sign in
                  </span>
                </p>
              </form>
            </>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <>
              <div className="mb-7">
                <h3 className="text-2xl font-bold text-text tracking-tight">Account created</h3>
                <p className="text-sm text-text2 mt-1">Here's what was set up for you</p>
              </div>
              <div className="flex flex-col bg-bg3 border border-border rounded-2xl overflow-hidden mb-6">
                {[
                  { label: "Manager",    value: name,     green: false },
                  { label: "Company",    value: company,  green: false },
                  { label: "First project", value: siteName, green: true  },
                ].map(({ label, value, green }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-4 border-b border-border last:border-b-0">
                    <span className="text-sm text-text3">{label}</span>
                    <span className={`text-sm font-semibold ${green ? "text-green" : "text-text"}`}>{value}</span>
                  </div>
                ))}
              </div>
              <Button label="Go to dashboard →" color="bg-blue" onClick={() => navigate("/manager/dashboard")} />
            </>
          )}
          </div>
        </div>
    </div>
  );
};

export default RegisterPage;
