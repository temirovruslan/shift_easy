import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, ChevronLeft, Lock } from "lucide-react";
import Button from "../components/ButtonComponent";
import Input from "../components/InputComponent";
import { activate } from "../api/auth";

const ActivatePage = () => {
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [strength, setStrength] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { token } = useParams();

  const handleActivate = async () => {
    try {
      await activate({ password: password1 }, token);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    }
  };
  useEffect(() => {
    if (password1.length === 0) setStrength(0);
    else if (password1.length < 4) setStrength(1);
    else if (password1.length < 8) setStrength(2);
    else setStrength(3);
  }, [password1]);

  const isMatch = password2.length > 0 && password1 === password2;

  const strengthLabel = ["", "Weak", "Medium", "Strong"][strength];
  const strengthColor = ["", "bg-red", "bg-amber", "bg-green"][strength];
  const strengthTextColor = ["", "text-red", "text-amber", "text-green"][
    strength
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green/10 rounded-full flex items-center justify-center mb-6">
            <Check size={30} color="#30d158" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-bold text-text tracking-tight mb-1">
            Account activated
          </h3>
          <p className="text-xs text-text2 mb-6">
            Your account is ready. Sign in to get started.
          </p>
          <Button
            label="Sign in"
            color="bg-blue"
            onClick={() => navigate("/")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="w-11 h-11 bg-blue/10 border border-blue/15 rounded-xl flex items-center justify-center mb-3">
          <Lock size={20} color="#659efb" absoluteStrokeWidth />
        </div>
        <button
          className="flex items-center gap-1 mb-8 hover:opacity-70 transition-opacity"
          onClick={() => navigate("/")}
        >
          <ChevronLeft size={16} color="#0a84ff" strokeWidth={2.5} />
          <p className="text-blue text-sm">Back</p>
        </button>

        <div className="mb-7">
          <h3 className="text-xl font-bold text-text tracking-tight">
            Set your password
          </h3>
          <p className="text-xs text-text2 mt-1">
            Choose a strong password for your account.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!password1 || password1.length < 8) {
              setError("Password must be at least 8 characters");
              return;
            }
            if (password1 !== password2) {
              setError("Passwords do not match");
              return;
            }
            setError("");
            handleActivate();
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Input
              type="password"
              label="New password"
              value={password1}
              onChange={setPassword1}
              placeholder="••••••••"
            />
            {strength > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${level <= strength ? strengthColor : "bg-bg3"}`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${strengthTextColor}`}>
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Input
              type="password"
              label="Confirm password"
              value={password2}
              onChange={setPassword2}
              placeholder="••••••••"
            />
            {password2.length > 0 && (
              <p className={`text-xs ${isMatch ? "text-green" : "text-red"}`}>
                {isMatch ? "Passwords match" : "Passwords do not match"}
              </p>
            )}
          </div>

          {error && <p className="text-xs text-red">{error}</p>}

          <Button label="Set new password" color="bg-green" type="submit" />
        </form>

        <p className="text-xs text-text3 text-center mt-4">
          Remember your password?{" "}
          <span
            className="text-blue cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => navigate("/")}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
};

export default ActivatePage;
