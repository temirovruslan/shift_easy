import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { updateSite } from "../api/sites";

type EditableFieldProps = {
  label: string;
  value: string;
  onSave: (newValue: string) => Promise<void>;
};

const EditableField = ({ label, value, onSave }: EditableFieldProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) {
      setEditing(false);
      setDraft(value);
      return;
    }
    setLoading(true);
    await onSave(trimmed);
    setLoading(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-semibold text-text3 uppercase tracking-widest mb-2">
        {label}
      </p>

      <div className="flex items-center gap-2">
        <input
          autoFocus={editing}
          readOnly={!editing}
          value={editing ? draft : value}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`flex-1 bg-bg2 rounded-xl px-3 py-2.5 text-sm font-semibold text-text outline-none transition-all ${
            editing
              ? "border border-blue/60 ring-2 ring-blue/10"
              : "border border-transparent cursor-default"
          }`}
        />

        {editing ? (
          <div className="flex gap-1.5">
            <button
              onClick={handleCancel}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg2 border border-border text-text3"
            >
              <X size={15} />
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue text-white disabled:opacity-50"
            >
              {loading ? (
                <span className="text-[10px] font-bold">...</span>
              ) : (
                <Check size={15} />
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg2 border border-border text-text3 hover:text-blue hover:border-blue/40 transition-colors"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

type EditSiteSectionProps = {
  siteId: string;
  name: string;
  address: string;
  onUpdate: (updated: { name: string; address: string }) => void;
};

const EditSiteSection = ({ siteId, name, address, onUpdate }: EditSiteSectionProps) => {
  const handleSaveName = async (newName: string) => {
    await updateSite(siteId, { name: newName });
    onUpdate({ name: newName, address });
  };

  const handleSaveAddress = async (newAddress: string) => {
    await updateSite(siteId, { address: newAddress });
    onUpdate({ name, address: newAddress });
  };

  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-2">
        Edit Site
      </p>
      <div className="bg-bg3 border border-border rounded-2xl divide-y divide-border">
        <EditableField label="Site name" value={name} onSave={handleSaveName} />
        <EditableField label="Address" value={address} onSave={handleSaveAddress} />
      </div>
    </div>
  );
};

export default EditSiteSection;
