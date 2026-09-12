import { StatusMessage } from "../types";

interface AdminAlertProps {
  statusMessage: StatusMessage | null;
  onClose: () => void;
}

export function AdminAlert({ statusMessage, onClose }: AdminAlertProps) {
  if (!statusMessage) return null;

  return (
    <div
      className={`mt-6 p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between gap-3 ${
        statusMessage.type === "error"
          ? "bg-red-50 text-red-800 border-red-200"
          : statusMessage.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-stone-100 text-stone-800 border-stone-200"
      }`}
    >
      <span>{statusMessage.text}</span>
      <button
        onClick={onClose}
        className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
        aria-label="Cerrar notificación"
      >
        ✕
      </button>
    </div>
  );
}

