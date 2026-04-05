function StatusCard({ status }) {
  const getStatusClass = () => {
    if (status === "Success") return "status-badge success";
    if (status === "CompilationError") return "status-badge error";
    if (status === "RuntimeError") return "status-badge error";
    if (status === "Running...") return "status-badge running";
    return "status-badge idle";
  };

  return (
    <div className="card">
      <h3>Status</h3>
      <div className={getStatusClass()}>{status}</div>
    </div>
  );
}

export default StatusCard;
