import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, Mail } from "lucide-react";
import Button from "../components/ButtonComponent";
import Input from "../components/InputComponent";
import { forgotPassword } from "../api/auth";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    try {
      const res = await forgotPassword(email);
      setSuccess(true);
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {success ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green/10 rounded-full flex items-center justify-center mb-6">
              <Check size={30} color="#30d158" strokeWidth={2.5} />
            </div>

            <h3 className="text-xl font-bold text-text tracking-tight mb-1">
              Check your email
            </h3>
            <p className="text-xs text-text2 mb-1">We sent a reset link to</p>
            <p className="text-xs text-blue font-medium mb-6">{email}</p>

            <div className="w-full bg-bg3 rounded-xl p-4 mb-4 text-left">
              <p className="text-[10px] font-bold text-text3 uppercase tracking-wide mb-3">
                What to do next
              </p>
              <ul className="flex flex-col gap-2.5">
                {[
                  "Open the email from ShiftEasy",
                  "Click the reset link inside",
                  "Set your new password",
                ].map((step, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-blue">
                        {i + 1}
                      </span>
                    </div>
                    <p className="text-xs text-text2">{step}</p>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-text3 mb-3">Didn't receive it?</p>
            <button
              onClick={() => handleForgotPassword()}
              className="text-xs text-blue hover:opacity-70 transition-opacity mb-4"
            >
              Resend email
            </button>
            <p className="text-xs text-amber mb-6">Link expires in 1 hour</p>
            <button
              className="flex items-center gap-1 hover:opacity-70 transition-opacity"
              onClick={() => navigate("/")}
            >
              <ChevronLeft size={16} color="#0a84ff" strokeWidth={2.5} />
              <p className="text-blue text-sm">Back to main page</p>
            </button>
          </div>
        ) : (
          <div>
            <div className="w-11 h-11 bg-blue/10 border border-blue/15 rounded-xl flex items-center justify-center mb-3">
              <Mail
                size={22}
                color="#0a84ff"
                strokeWidth={1.5}
                absoluteStrokeWidth
              />
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
                Forgot password?
              </h3>
              <p className="text-xs text-text2 mt-1">
                No worries. Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!email) {
                  setError("Email is required");
                  return;
                }
                setError("");
                handleForgotPassword();
              }}
              className="flex flex-col gap-4"
            >
              <Input
                type="email"
                label="Email address"
                value={email}
                onChange={setEmail}
                placeholder="mart@ehituse.ee"
              />

              {error && <p className="text-xs text-red">{error}</p>}

              <Button label="Send reset link" color="bg-blue" type="submit" />
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
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
