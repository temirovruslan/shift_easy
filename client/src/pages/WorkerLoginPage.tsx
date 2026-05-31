import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import Button from "../components/ButtonComponent";
import Input from "../components/InputComponent";
import { login as loginWorker } from "../api/auth";
import { useAuth } from "../context/AuthContext";

const WorkerLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const workerLogin = async () => {
    try {
      const res = await loginWorker({ email, password });
      if (res.data.role !== "worker") {
        setError(
          "This is the worker login. Your account is a manager account — please use the manager sign in page.",
        );
        return;
      }
      login({ name: res.data.name, role: res.data.role }, res.data.token);
      navigate("/worker/home");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Wrong email or password. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <button
          className="flex items-center gap-1 mb-8 hover:opacity-70 transition-opacity"
          onClick={() => navigate("/")}
        >
          <ChevronLeft size={16} color="#0a84ff" strokeWidth={2.5} />
          <p className="text-blue text-sm">Back</p>
        </button>

        <div className="mb-7">
          <h3 className="text-xl font-bold text-text tracking-tight">
            Worker sign in
          </h3>
          <p className="text-xs text-text2 mt-1">
            Enter your invite credentials
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
            workerLogin();
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
              onClick={() => navigate("/forgot-password")}
              type="button"
              className="text-xs text-blue hover:opacity-70 transition-opacity"
            >
              Forgot password?
            </button>
          </div>
          {error && <p className="text-xs text-red">{error}</p>}

          <Button label="Sign in" color="bg-blue" type="submit" />
        </form>

        <div className="bg-blue/5 border border-blue/15 rounded-xl px-3.5 py-3 mt-4">
          <p className="text-xs text-blue/80 leading-relaxed">
            Your manager registered your account and sent you an invite email.
            Use those credentials to sign in.
          </p>
        </div>

        <p className="text-xs text-text3 text-center mt-4">
          No invite yet? <span className="text-blue">Contact manager</span>
        </p>
      </div>
    </div>
  );
};

export default WorkerLoginPage;
