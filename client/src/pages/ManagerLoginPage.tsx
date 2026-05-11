import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import Button from "../components/ButtonComponent";
import Input from "../components/InputComponent";
import { login as loginManager } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

const ManagerLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();
  console.log(useAuth)
  const managerLogin = async () => {
    try {
      const res = await loginManager({
        email,
        password,
      });
      login({ name: res.data.name, role: res.data.role }, res.data.token);
      navigate('/manager/dashboard')
      return res.data.token;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
     
      <div className="w-full max-w-xs">
        <button
          className="flex items-center gap-1 mb-8 hover:opacity-70 transition-opacity"
          onClick={() => navigate("/")}
        >
          <ChevronLeft size={16} color="#0a84ff" strokeWidth={2.5} />
          <p className="text-blue text-sm">Back</p>
        </button>
        <div className="mb-7">
          <h3 className="text-xl font-bold text-text tracking-tight">
            Manager sign in
          </h3>
          <p className="text-xs text-text2 mt-1">
            Access your team and dashboard
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!email) {
              setError("Email is required");
              return;
            }
            if (!password || password.length < 8) {
              setError("Password must be at least 8 characters");
              return;
            }
            managerLogin();
          }}
          className="flex flex-col gap-4"
        >
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

          <div className="flex justify-end -mt-2">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs text-blue hover:opacity-70 transition-opacity"
            >
              Forgot password?
            </button>
          </div>
          {error && <p className="text-xs text-red">{error}</p>}

          <Button label="Sign in as a manager" color="bg-green" type="submit" />
        </form>

        <div className="bg-bg3 border border-blue/15 rounded-xl px-3.5 py-3 mt-4">
          <p className="text-[10px] font-bold text-text3 uppercase tracking-wide mb-2">
            Manager access includes
          </p>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-text2">→ Add and manage workers</p>
            <p className="text-xs text-text2">→ View live timesheets</p>
            <p className="text-xs text-text2">→ Mobile + desktop access</p>
          </div>
        </div>
        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text3">no account?</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <button
          className="w-full text-center text-sm text-blue hover:opacity-70 transition-opacity"
          onClick={() => navigate("/register")}
        >
          Create company account
        </button>
      </div>
    </div>
  );
};

export default ManagerLoginPage;
