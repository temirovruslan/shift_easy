import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, CheckCircle } from "lucide-react";
import Button from "../components/ButtonComponent";
import Input from "../components/InputComponent";
import { register as registerApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [error2, setError2] = useState("");

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");

  const stepLabels = ["Your details", "First site", "Done"];

  const { login } = useAuth();

  const registration = async () => {
    if (!siteName || siteName.length < 2) {
      setError2("Site name is required");
      return;
    }
    if (!siteAddress || siteAddress.length < 5) {
      setError2("Enter a full address");
      return;
    }
    setError2("");
    try {
      const res = await registerApi({
        name,
        companyName: company,
        email,
        password,
        siteName,
        siteAddress,
      });
      login({ name: res.data.name, role: res.data.role }, res.data.token);
      setStep(3);
    } catch (err: any) {
      setError2(err?.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs">
        {step < 3 && (
          <button
            className="flex items-center gap-1 mb-8 hover:opacity-70 transition-opacity"
            onClick={() => (step === 1 ? navigate("/") : setStep((s) => s - 1))}
          >
            <ChevronLeft size={16} color="#0a84ff" strokeWidth={2.5} />
            <p className="text-blue text-sm">Back</p>
          </button>
        )}

        <div className="mb-5">
          <h3 className="text-xl font-bold text-text tracking-tight">
            Create company
          </h3>
          <p className="text-xs text-text2 mt-1">Set up your manager account</p>
        </div>

        {step < 3 && (
          <>
            <div className="flex gap-1.5 mb-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${s <= step ? "bg-green" : "bg-bg3"}`}
                />
              ))}
            </div>
            <p className="text-xs text-text3 mb-6">
              Step {step} of 3 — {stepLabels[step - 1]}
            </p>
          </>
        )}

        {step === 1 && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name || name.length < 2) {
                setError("Name must be at least 2 characters");
                return;
              }
              if (!company) {
                setError("Company name is required");
                return;
              }
              if (!email) {
                setError("Email is required");
                return;
              }
              if (!password || password.length < 8) {
                setError("Password must be at least 8 characters");
                return;
              }
              setError("");
              setStep(2);
            }}
          >
            <Input
              type="text"
              label="Full name"
              value={name}
              onChange={setName}
              placeholder="Sara Chen"
            />
            <Input
              type="text"
              label="Company name"
              value={company}
              onChange={setCompany}
              placeholder="ConstructCo Ltd"
            />
            <Input
              type="email"
              label="Email address"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
            />
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />
            {error && <p className="text-xs text-red">{error}</p>}
            <Button label="Continue →" color="bg-blue" type="submit" />
            <p className="text-xs text-text3 text-center -mt-1">
              Have an account?{" "}
              <span
                className="text-blue cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => navigate("/login/manager")}
              >
                Sign in
              </span>
            </p>
          </form>
        )}

        {step === 2 && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              registration();
            }}
          >
            <Input
              type="text"
              label="Site name"
              value={siteName}
              onChange={setSiteName}
              placeholder="Main warehouse"
            />
            <Input
              type="text"
              label="Site address"
              value={siteAddress}
              onChange={setSiteAddress}
              placeholder="123 Builder St, Tallinn"
            />
            {error2 && <p className="text-xs text-red">{error2}</p>}

            <Button label="Continue →" color="bg-blue" type="submit" />
          </form>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center text-center gap-4 py-6">
            <div className="w-14 h-14 rounded-full bg-green/10 flex items-center justify-center">
              <CheckCircle size={28} color="#30d158" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text">You're all set!</h3>
              <p className="text-xs text-text2 mt-1">
                Your company and first site are ready.
              </p>
            </div>

            <Button
              label="Go to dashboard"
              color="bg-green"
              onClick={() => {
                navigate("/manager/dashboard");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
