import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  UserPlus,
  User,
  Briefcase,
  Mail,
  RotateCcw,
  Search,
} from "lucide-react";
import NavbarManager from "../components/NavbarManager";
import Loader from "../components/Loader";
import {
  getAllWorkers,
  createWorker,
  getArchivedWorkers,
  restoreWorker,
} from "../api/worker";

const AddWorkerSheet = ({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [occupation, setOccupation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await createWorker({ name, email, occupation });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-bg border-t border-border rounded-t-3xl w-full max-w-sm">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-5">
          <div>
            <h2 className="text-lg font-bold text-text">Add Worker</h2>
            <p className="text-xs text-text3 mt-0.5">
              Worker logs in with these credentials
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg3 text-text3"
          >
            <X size={15} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 pb-8">
          {[
            {
              label: "Full name",
              value: name,
              onChange: setName,
              type: "text",
              placeholder: "e.g. Ahmed Al-Rashid",
              icon: User,
            },
            {
              label: "Email",
              value: email,
              onChange: setEmail,
              type: "email",
              placeholder: "e.g. ahmed@company.com",
              icon: Mail,
            },
            {
              label: "Occupation",
              value: occupation,
              onChange: setOccupation,
              type: "text",
              placeholder: "e.g. Electrician",
              icon: Briefcase,
            },
          ].map(({ label, value, onChange, type, placeholder, icon: Icon }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text3 uppercase tracking-widest px-1">
                {label}
              </label>
              <div className="flex items-center gap-3 bg-bg3 border border-border rounded-2xl px-4 py-3.5 focus-within:border-blue/50 transition-colors">
                <Icon size={15} className="text-text3 shrink-0" />
                <input
                  type={type}
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-text placeholder:text-text3 outline-none"
                />
              </div>
            </div>
          ))}
          {error && <p className="text-xs text-red px-1">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue rounded-2xl py-4 text-sm font-bold text-white disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
          >
            <UserPlus size={15} />
            {loading ? "Creating..." : "Add Worker"}
          </button>
        </form>
      </div>
    </div>
  );
};

const ManagerShowListOfWorkersPage = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<any[]>([]);
  const [archivedWorkers, setArchivedWorkers] = useState<any[]>([]);
  const [filter, setFilter] = useState<
    "all" | "active" | "pending" | "archived"
  >("all");
  const [search, setSearch] = useState("");
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const [res, res2] = await Promise.all([
          getAllWorkers(),
          getArchivedWorkers(),
        ]);
        setWorkers(res.data);
        setArchivedWorkers(res2.data);
      } catch (error) {
      } finally {
        setIsLoaded(true);
      }
    };
    fetchWorkers();
  }, []);

  if (!isLoaded) return <Loader />;

  const q = search.toLowerCase();

  const filtered = workers.filter((w: any) => {
    const matchesSearch =
      w.name.toLowerCase().includes(q) ||
      w.occupation?.toLowerCase().includes(q);
    if (filter === "active") return w.isActivated && matchesSearch;
    if (filter === "pending") return !w.isActivated && matchesSearch;
    return matchesSearch;
  });

  const filteredArchived = archivedWorkers.filter(
    (w: any) =>
      w.name.toLowerCase().includes(q) ||
      w.occupation?.toLowerCase().includes(q),
  );

  const handleRestore = async (e: React.MouseEvent, workerId: string) => {
    e.stopPropagation();
    setRestoringId(workerId);
    try {
      await restoreWorker(workerId);
      const restored = archivedWorkers.find((w) => w._id === workerId);
      setArchivedWorkers((prev) => prev.filter((w) => w._id !== workerId));
      if (restored)
        setWorkers((prev) => [{ ...restored, isArchived: false }, ...prev]);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg px-5 pt-14 pb-24">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-text">Workers</h1>
          {filter !== "archived" && (
            <button
              onClick={() => setShowAddSheet(true)}
              className="flex items-center gap-1.5 bg-blue rounded-xl px-4 py-2 text-sm font-bold text-white"
            >
              <span className="text-base leading-none">+</span> Add
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 bg-bg3 border border-border rounded-2xl px-4 py-3 mb-4 focus-within:border-blue/50 transition-colors">
          <Search size={15} className="text-text3 shrink-0" />
          <input
            type="text"
            placeholder="Search by name or occupation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text3 outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-text3 hover:text-text"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {(["all", "active", "pending", "archived"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize shrink-0 transition-colors ${
                filter === key
                  ? key === "archived"
                    ? "bg-amber-500 text-white"
                    : "bg-blue text-white"
                  : "bg-bg3 border border-border text-text3"
              }`}
            >
              {key}
              {key === "archived" && archivedWorkers.length > 0 && (
                <span className="ml-1.5 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {archivedWorkers.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-bg3 border border-border rounded-2xl overflow-hidden">
          {filter === "archived" ? (
            filteredArchived.length === 0 ? (
              <p className="text-sm text-text3 text-center py-8">
                No archived workers
              </p>
            ) : (
              filteredArchived.map((worker: any) => (
                <div
                  key={worker._id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0"
                >
                  <div className="w-10 h-10 rounded-full bg-bg2 border border-border flex items-center justify-center text-xs font-bold text-text3 shrink-0">
                    {worker.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text3 truncate">
                      {worker.name}
                    </p>
                    <p className="text-[11px] text-text3 truncate">
                      {worker.occupation} · {worker.sites[0]?.name ?? "No site"}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleRestore(e, worker._id)}
                    disabled={restoringId === worker._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue/10 text-blue text-xs font-bold disabled:opacity-50 shrink-0"
                  >
                    <RotateCcw size={11} />
                    {restoringId === worker._id ? "..." : "Restore"}
                  </button>
                </div>
              ))
            )
          ) : (
            filtered.map((worker: any) => (
              <div
                key={worker._id}
                onClick={() => navigate(`/manager/worker/${worker._id}`)}
                className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 cursor-pointer active:bg-bg2 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {worker.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">
                    {worker.name}
                  </p>
                  <p className="text-[11px] text-text3 truncate">
                    {worker.occupation} · {worker.sites[0]?.name ?? "No site"}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    worker.isActivated
                      ? "bg-green/15 text-green"
                      : "bg-amber-500/15 text-amber-500"
                  }`}
                >
                  {worker.isActivated ? "Active" : "Pending"}
                </span>
              </div>
            ))
          )}
        </div>

        {showAddSheet && (
          <AddWorkerSheet
            onClose={() => setShowAddSheet(false)}
            // onCreated={(w) => setWorkers((prev) => [w, ...prev])}
            onCreated={async () => {
              const [res, res2] = await Promise.all([
                getAllWorkers(),
                getArchivedWorkers(),
              ]);
              setWorkers(res.data);
              setArchivedWorkers(res2.data);
            }}
          />
        )}
      </div>
      <NavbarManager />
    </div>
  );
};

export default ManagerShowListOfWorkersPage;
