import { useEffect, useState } from "react";
import { getHistory, getHistoryDetail, deleteHistory, deleteHistoryRecord, resultUrl } from "../services/api";
import "../styles/RegistrationHistory.css";

export default function RegistrationHistory({ onSelectRecord }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecordId, setLoadingRecordId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirmAll, setShowConfirmAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getHistory();
      setHistory(data.registrations || []);
    } catch (err) {
      setError("Failed to load registration history from telemetry database.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getHistory()
      .then((data) => {
        if (isMounted) {
          setHistory(data.registrations || []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError("Failed to load registration history from telemetry database.");
          console.error(err);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInspect = async (record) => {
    if (!onSelectRecord) return;
    setLoadingRecordId(record.id);
    try {
      if (record.id) {
        const fullDetail = await getHistoryDetail(record.id);
        onSelectRecord(fullDetail);
      } else {
        onSelectRecord(record);
      }
    } catch (err) {
      console.warn("Could not load deep detail, falling back to summary record", err);
      onSelectRecord(record);
    } finally {
      setLoadingRecordId(null);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    setError("");
    try {
      await deleteHistory();
      setHistory([]);
      setShowConfirmAll(false);
      setSuccessMessage("All mission registration history successfully cleared.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError("Failed to delete registration history from database.");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteRecord = async (recordId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Permanently delete this lunar registration record from telemetry archive?")) return;
    setDeletingId(recordId);
    setError("");
    try {
      await deleteHistoryRecord(recordId);
      setHistory((prev) => prev.filter((r) => r.id !== recordId));
      setSuccessMessage("Registration record removed from mission archive.");
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (err) {
      setError("Failed to delete record.");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " " + date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "number") return value.toFixed(2);
    return value;
  };

  return (
    <section className="registration-history panel" id="history-section">
      <div className="section-top">
        <div>
          <span className="eyebrow">03 / MISSION ARCHIVE &amp; TELEMETRY</span>
          <h2>Registration History</h2>
        </div>
        <div className="history-header-actions">
          {history.length > 0 && (
            showConfirmAll ? (
              <div className="confirm-delete-box">
                <span className="confirm-delete-text">Purge all logs?</span>
                <button
                  type="button"
                  className="confirm-delete-btn"
                  onClick={handleDeleteAll}
                  disabled={deleting}
                >
                  {deleting ? "PURGING..." : "CONFIRM PURGE"}
                </button>
                <button
                  type="button"
                  className="cancel-delete-btn"
                  onClick={() => setShowConfirmAll(false)}
                  disabled={deleting}
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="delete-history-button"
                onClick={() => setShowConfirmAll(true)}
                disabled={loading || deleting}
                title="Permanently purge mission history archive"
              >
                🗑️ DELETE HISTORY
              </button>
            )
          )}
          <button
            type="button"
            className="refresh-button"
            onClick={fetchHistory}
            disabled={loading || deleting}
            title="Query telemetry database"
          >
            {loading ? "⟳ QUERYING..." : "⟳ REFRESH"}
          </button>
        </div>
      </div>

      <p className="history-subtitle">
        Historical optical registrations recorded in the Supabase flight telemetry database. Select any previous mission to reload full correspondence geometry and visualizations, or purge records as needed.
      </p>

      {successMessage && <div className="success-message">{successMessage}</div>}
      {error && <div className="error-message">{error}</div>}

      {history.length === 0 && !loading && (
        <div className="empty-state">
          <p>No historical registrations logged yet. Execute your first lunar image correspondence above.</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Telemetry Timestamp</th>
                <th>Source Frame</th>
                <th>Reference Frame</th>
                <th>Matches</th>
                <th>Inliers</th>
                <th>Inlier Ratio</th>
                <th>RMSE (px)</th>
                <th>Coverage</th>
                <th>AI Confidence</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record, idx) => {
                const confScore = record.confidence ?? 0;
                const confBadge = confScore >= 80 ? "HIGH" : confScore >= 55 ? "MED" : "LOW";
                const badgeColor = confScore >= 80 ? "badge-green" : confScore >= 55 ? "badge-amber" : "badge-red";
                const isSelectedLoading = loadingRecordId === record.id;

                return (
                  <tr key={record.id || idx}>
                    <td className="date-cell">{formatDate(record.created_at)}</td>
                    <td className="filename-cell" title={record.source_filename}>
                      {record.source_filename ? record.source_filename.replace(/^.*[\\/]/, "").substring(0, 18) : "N/A"}
                    </td>
                    <td className="filename-cell" title={record.reference_filename}>
                      {record.reference_filename ? record.reference_filename.replace(/^.*[\\/]/, "").substring(0, 18) : "N/A"}
                    </td>
                    <td className="number-cell">{record.total_matches}</td>
                    <td className="number-cell highlight-green">{record.inlier_count}</td>
                    <td className="number-cell highlight-amber">
                      {record.inlier_ratio !== null ? `${(Number(record.inlier_ratio) * (Number(record.inlier_ratio) <= 1 ? 100 : 1)).toFixed(1)}%` : "N/A"}
                    </td>
                    <td className="number-cell">{formatValue(record.registration_rmse)}</td>
                    <td className="number-cell">
                      {record.spatial_coverage !== null ? `${formatValue(record.spatial_coverage)}%` : "N/A"}
                    </td>
                    <td className="number-cell">
                      <span className={`history-conf-tag ${badgeColor}`}>
                        {confBadge} {confScore ? `(${Math.round(confScore)}%)` : ""}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons-group">
                        <button
                          type="button"
                          className="history-open-button"
                          onClick={() => handleInspect(record)}
                          disabled={isSelectedLoading || deletingId === record.id}
                          title="Open in visual workspace"
                        >
                          {isSelectedLoading ? "..." : "INSPECT →"}
                        </button>
                        {record.registered_image_url && (
                          <a
                            href={resultUrl(record.registered_image_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="action-link"
                            title="Open raw image"
                          >
                            RAW
                          </a>
                        )}
                        <button
                          type="button"
                          className="history-item-delete-btn"
                          onClick={(e) => handleDeleteRecord(record.id, e)}
                          disabled={deletingId === record.id}
                          title="Delete this record from telemetry archive"
                        >
                          {deletingId === record.id ? "..." : "✕"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
