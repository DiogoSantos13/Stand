import { useToast } from "../context/ToastContext";

function ToastContainer() {
  const { toasts } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast ${
            t.type === "error" ? "toast-error" : "toast-success"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
