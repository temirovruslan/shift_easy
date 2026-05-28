import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  ChevronRight,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { getWorker, removeWorker, sendInvite, updateWorker } from "../api/worker";
import NavbarManager from "../components/NavbarManager";
import Loader from "../components/Loader";

const ConfirmRemoveSheet = ({
  workerName,
  onCancel,
  onConfirm,
  loading,
}: {
  workerName: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative bg-bg border-t border-border rounded-t-3xl w-full max-w-sm px-5 pt-6 pb-10 md:rounded-2xl md:border md:border-border md:pb-6">
      <div className="flex justify-center mb-5">
        <div className="w-12 h-12 rounded-2xl bg-red/10 flex items-center justify-center">
          <AlertTriangle size={22} className="text-red" />
        </div>
      </div>
      <h2 className="text-lg font-bold text-text text-center mb-1">Archive worker?</h2>
      <p className="text-sm text-text3 text-center mb-6">
        <span className="text-text font-semibold">{workerName}</span> will be archived and removed from the workers list. They can be restored later.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3.5 rounded-2xl bg-bg3 border border-border text-sm font-bold text-text">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading} className="flex-1 py-3.5 rounded-2xl bg-red text-sm font-bold text-white disabled:opacity-50">
          {loading ? "Archiving..." : "Archive"}
        </button>
      </div>
    </div>
  </div>
);

const ManagerShowListOfWorkersPageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [worker, setWorker] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editOccupation, setEditOccupation] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const res = await getWorker(id!);
        setWorker(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchWorker();
  }, [id]);

  if (!isLoaded) return <Loader />;
  if (!worker) return null;

  const initials = worker.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const joinedDate = new Date(worker.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await removeWorker(id!);
      navigate("/manager/workers");
    } catch {
      setRemoving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg px-5 pt-14 pb-24 md:ml-52 md:pt-10">
      <div className="max-w-lg mx-auto">
        {/* Back + Edit */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/manager/workers")} className="flex items-center gap-1 text-blue text-sm">
            <ChevronLeft size={16} />
            Workers
          </button>
          <button
            onClick={() => {
              setEditName(worker.name);
              setEditEmail(worker.email);
              setEditOccupation(worker.occupation ?? "");
              setEditError(null);
              setShowEdit(true);
            }}
            className="flex items-center gap-1.5 text-sm font-semibold text-blue"
          >
            <Pencil size={14} />
            Edit
          </button>
        </div>

        {/* Avatar + name + status */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-blue flex items-center justify-center text-2xl font-bold text-white mb-4 ring-4 ring-blue/20">
            {initials}
          </div>
          <h1 className="text-2xl font-bold text-text">{worker.name}</h1>
          <p className="text-sm text-text3 mt-1">{worker.occupation}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full ${worker.isActivated ? "bg-green/15 text-green" : "bg-amber-500/15 text-amber-500"}`}>
              {worker.isActivated ? "● Active" : "⏳ Pending"}
            </span>
            {worker.sites[0] && (
              <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-blue/10 text-blue">
                {worker.sites[0].name}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-2">Info</p>
        <div className="bg-bg3 border border-border rounded-2xl overflow-hidden mb-5">
          {[
            { icon: Mail, label: "Email", value: worker.email, highlight: true },
            { icon: Briefcase, label: "Occupation", value: worker.occupation, highlight: false },
            { icon: MapPin, label: "Project", value: worker.sites[0]?.name ?? "No project", highlight: false },
            { icon: Calendar, label: "Joined", value: joinedDate, highlight: false },
          ].map(({ icon: Icon, label, value, highlight }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-b-0">
              <div className="w-8 h-8 rounded-xl bg-bg2 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-text3" />
              </div>
              <p className="text-sm text-text3 flex-1">{label}</p>
              <p className={`text-sm font-semibold ${highlight ? "text-blue" : "text-text"}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-2">Actions</p>
        <div className="bg-bg3 border border-border rounded-2xl overflow-hidden mb-3">
          <button
            onClick={async () => {
              setInviting(true);
              try {
                await sendInvite(id!);
                alert("Invite sent successfully!");
              } catch {
                alert("Failed to send invite.");
              } finally {
                setInviting(false);
              }
            }}
            disabled={inviting}
            className="w-full flex items-center justify-between px-4 py-3.5 disabled:opacity-50"
          >
            <p className="text-sm font-semibold text-text">{inviting ? "Sending..." : "Resend invite email"}</p>
            <ChevronRight size={16} className="text-text3" />
          </button>
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          className="w-full bg-red/10 border border-red/30 rounded-2xl py-4 flex items-center justify-center gap-2 text-sm font-bold text-red"
        >
          Archive worker
          <span>→</span>
        </button>
      </div>

      {showConfirm && (
        <ConfirmRemoveSheet
          workerName={worker.name}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleRemove}
          loading={removing}
        />
      )}

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEdit(false)} />
          <div className="relative bg-bg border-t border-border rounded-t-3xl w-full max-w-sm px-5 pt-4 pb-10 md:rounded-2xl md:border md:border-border md:pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <h2 className="text-lg font-bold text-text mb-5">Edit Worker</h2>
            {[
              { label: "Full name", value: editName, onChange: setEditName, type: "text" },
              { label: "Email", value: editEmail, onChange: setEditEmail, type: "email" },
              { label: "Occupation", value: editOccupation, onChange: setEditOccupation, type: "text" },
            ].map(({ label, value, onChange, type }) => (
              <div key={label} className="flex flex-col gap-1.5 mb-3">
                <label className="text-[10px] font-bold text-text3 uppercase tracking-widest px-1">{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="bg-bg3 border border-border rounded-2xl px-4 py-3.5 text-sm text-text outline-none focus:border-blue/50 transition-colors"
                />
              </div>
            ))}
            {editError && <p className="text-xs text-red px-1 mb-3">{editError}</p>}
            <button
              onClick={async () => {
                setEditError(null);
                setSaving(true);
                try {
                  const res = await updateWorker(id!, { name: editName, email: editEmail, occupation: editOccupation });
                  setWorker(res.data);
                  setShowEdit(false);
                } catch (err: any) {
                  setEditError(err.response?.data?.message ?? "Something went wrong");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="w-full bg-blue rounded-2xl py-4 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      )}

      <NavbarManager />
    </div>
  );
};

export default ManagerShowListOfWorkersPageDetail;
