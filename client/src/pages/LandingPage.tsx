import { useNavigate } from "react-router-dom";
import { User, Mail, Plus, ChevronRight } from "lucide-react";
import Logo from "../components/LogoComponent";
import Button from "../components/ButtonComponent";
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="flex flex-col items-center mb-10">
          <Logo />

          <h1 className="text-2xl font-bold text-text tracking-tight">
            ShiftEasy
          </h1>
          <p className="text-xs text-text2 mt-1">Construction time tracking</p>
        </div>

        <p className="text-xs text-text2 text-center mb-3">
          Choose how to continue
        </p>

        <button
          onClick={() => navigate("/login/worker")}
          className="w-full bg-bg3 border border-blue/30 rounded-2xl p-3 mb-2 hover:border-blue transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue/10 flex items-center justify-center shrink-0">
              <User size={16} color="#0a84ff" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[14px] font-semibold text-text">I'm a worker</p>
              <p className="text-[14px] text-text2 mt-0.5">
                Sign in with invite credentials
              </p>
            </div>
            <ChevronRight size={16} color="#0a84ff" />
          </div>
        </button>

        <button
          onClick={() => navigate("/login/manager")}
          className="w-full bg-bg3 border border-green/30 rounded-2xl p-3 mb-2 hover:border-green transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green/10 flex items-center justify-center shrink-0">
              <Mail size={16} color="#30d158" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[14px] font-semibold text-text">I'm a manager</p>
              <p className="text-[14px] text-text2 mt-0.5">
                Sign in to your account
              </p>
            </div>
            <ChevronRight size={16} color="#30d158" />
          </div>
        </button>

        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text3">no account?</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={() => navigate("/register")}
          className="w-full bg-bg3 border border-purple/30 rounded-2xl p-3 hover:border-purple transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple/10 flex items-center justify-center shrink-0">
              <Plus size={16} color="#a78bfa" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[14px] font-semibold text-purple">
                Register as manager
              </p>
              <p className="text-[14px] text-text2 mt-0.5">Create your company</p>
            </div>
            <ChevronRight size={16} color="#a78bfa" />
          </div>
        </button>
        <Button />
        <p className="text-text3 text-xs  text-center mt-8">
          Workers cannot create accounts — your manager registers you.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
