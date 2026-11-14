export default function ErrorPanel({ message = "", onRetry = null }) {
  const lower = (message || "").toLowerCase();

  let category = "REGISTRATION EXCEPTION";
  let cause = "The registration pipeline encountered an unrecoverable geometric or processing error.";
  let recommendation = "Verify lunar coordinate overlap and retry with enhanced illumination contrast or LoFTR model.";

  if (lower.includes("backend is offline") || lower.includes("network error") || lower.includes("refused") || lower.includes("failed to fetch")) {
    category = "BACKEND DISCONNECTED";
    cause = "Mission-control backend service at http://127.0.0.1:8000 is unreachable.";
    recommendation = "Ensure the FastAPI server is running with 'uvicorn backend.main:app --port 8000'.";
  } else if (lower.includes("timeout") || lower.includes("econnaborted")) {
    category = "PIPELINE TIMEOUT";
    cause = "Processing exceeded time allocation. High-resolution imagery or dense transformer inference may have taken longer than allowed.";
    recommendation = "Try SIFT + MAGSAC mode or verify CPU resource availability.";
  } else if (lower.includes("few matches") || lower.includes("not enough") || lower.includes("insufficient") || lower.includes("< 4") || lower.includes("< 8")) {
    category = "INSUFFICIENT CORRESPONDENCES";
    cause = "Fewer than 4 geometrically valid feature points were identified between source and reference frames.";
    recommendation = "Switch to LoFTR Deep Transformer, which performs detector-free dense matching even in shadowed polar terrain.";
  } else if (lower.includes("homography") || lower.includes("singular") || lower.includes("degenerate") || lower.includes("invalid transformation")) {
    category = "DEGENERATE HOMOGRAPHY";
    cause = "Collinear keypoints or inverted coordinate projection prevented stable perspective matrix computation.";
    recommendation = "Select frames with wider spatial baseline coverage across multiple lunar craters.";
  } else if (lower.includes("spatial") || lower.includes("distribution") || lower.includes("convex hull")) {
    category = "POOR SPATIAL DISTRIBUTION";
    cause = "All matched keypoints are concentrated in a tiny cluster (<5% surface area), making global alignment unstable.";
    recommendation = "Enable CLAHE enhancement or use the LoFTR transformer model.";
  } else if (lower.includes("rmse") || lower.includes("residual")) {
    category = "EXCESSIVE REPROJECTION ERROR";
    cause = "Reprojection residual error exceeds the flight safety threshold (>5.0 pixels).";
    recommendation = "Check for non-planar extreme 3D relief or viewpoint angle disparity.";
  } else if (lower.includes("format") || lower.includes("unsupported") || lower.includes("invalid image")) {
    category = "INVALID IMAGE FORMAT";
    cause = "Provided file could not be decoded as standard lunar raster imagery.";
    recommendation = "Ensure images are standard PNG, JPG, or TIFF format.";
  }

  return (
    <div className="error-panel" role="alert">
      <span className="error-symbol">⚠</span>
      <div className="error-content">
        <div className="error-header-row">
          <span className="eyebrow">{category}</span>
          {onRetry && (
            <button type="button" className="error-retry-btn" onClick={onRetry}>
              ↺ RETRY
            </button>
          )}
        </div>
        <h3 className="error-title">{message || "Image registration could not be completed."}</h3>
        <div className="error-details">
          <p>
            <b>Diagnostic Root Cause:</b> {cause}
          </p>
          <p>
            <b>Recommended Action:</b> {recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}