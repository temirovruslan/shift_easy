import { useState } from "react";
import { X, Users, CheckCircle2, UserPlus } from "lucide-react";
import { assignWorkers } from "../api/worker";

export type WorkerOption = { _id: string; name: string; email: string };

interface AssignWorkersModalProps {
  siteId: string;
  availableWorkers: WorkerOption[];
  onClose: () => void;
  onAssigned: (assigned: WorkerOption[]) => void;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const AssignWorkersModal = ({
  siteId,
  availableWorkers,
  onClose,
  onAssigned,
}: AssignWorkersModalProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleAssign = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      await assignWorkers(siteId, selected);
      onAssigned(availableWorkers.filter((w) => selected.includes(w._id)));
      onClose();
    } catch (err) {
      console.error(err);
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
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <div>
            <h2 className="text-lg font-bold text-text">Add Workers</h2>
            <p className="text-xs text-text3 mt-0.5">
              {availableWorkers.length} available
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg3 text-text3 hover:text-text transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Worker list */}
        <div className="max-h-64 overflow-y-auto px-3">
          {availableWorkers.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <div className="w-12 h-12 rounded-2xl bg-bg3 flex items-center justify-center">
                <Users size={20} className="text-text3" />
              </div>
              <p className="text-sm font-semibold text-text">All caught up</p>
              <p className="text-xs text-text3">
                All workers are already assigned
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 pb-3">
              {availableWorkers.map((worker) => {
                const isSelected = selected.includes(worker._id);
                return (
                  <button
                    key={worker._id}
                    onClick={() => toggle(worker._id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors ${
                      isSelected
                        ? "bg-blue/10 border border-blue/20"
                        : "bg-bg3 border border-transparent"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-blue/20 flex items-center justify-center text-xs font-bold text-blue shrink-0">
                      {getInitials(worker.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate">
                        {worker.name}
                      </p>
                      <p className="text-[11px] text-text3 truncate">
                        {worker.email}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? "bg-blue" : "border-2 border-border"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2
                          size={14}
                          className="text-white"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Assign button */}
        <div className="px-5 pt-2 pb-8">
          <button
            onClick={handleAssign}
            disabled={selected.length === 0 || loading}
            className="w-full bg-blue rounded-2xl py-4 text-sm font-bold text-white disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
          >
            <UserPlus size={16} />
            {loading
              ? "Assigning..."
              : selected.length > 0
                ? `Assign ${selected.length} worker${selected.length > 1 ? "s" : ""}`
                : "Select workers above"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignWorkersModal;
