import { useState } from "react";

export default function TechnicalDetails({ algorithm = "LOFTR_MAGSAC", result = null }) {
  const [open, setOpen] = useState(false);

  const isLoftr = (algorithm || "").toUpperCase().includes("LOFTR") || (result?.algorithm_key || "").includes("LOFTR");
  const isMagsac = (algorithm || "").toUpperCase().includes("MAGSAC");

  const details = [
    ["Feature Engine", isLoftr ? "LoFTR Dense Attention Transformer" : "SIFT (Scale-Invariant Feature Transform)"],
    ["Correspondence Architecture", isLoftr ? "Detector-Free Coarse-to-Fine Matching" : "L2-Norm Nearest Neighbor + Lowe's Ratio Test (0.75)"],
    ["Consensus Verification", isMagsac ? "USAC_MAGSAC (Marginalizing Sample Consensus)" : "RANSAC (Random Sample Consensus)"],
    ["Transformation Model", "Perspective Homography 3×3 H Matrix"],
    ["Spatial Distribution Metric", "OpenCV Convex Hull Area Ratio + 2D Shannon Entropy"],
    ["AI Confidence Model", "Multi-Factor Composite Score (Coverage, Inlier Ratio, RMSE, Entropy)"],
    ["Image Enhancement", result?.clahe_applied ? "CLAHE (Contrast Limited Adaptive Histogram Equalization)" : "Standard Grayscale Normalization"],
    ["Backend Execution", "FastAPI + PyTorch TorchScript + OpenCV 5.0"],
    ["Mission Sensor Profiles", "Chandrayaan-2 OHRC (0.25m) / TMC-2 (5.0m) / LROC-NAC"],
    ["Persistence Layer", "Supabase PostgreSQL Database + Local Archive Fallback"]
  ];

  return (
    <section className={`panel technical-details ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="technical-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>
          <span className="eyebrow">CHANDRAYAAN OPTICAL SPECIFICATION</span>
          <strong>Technical Details &amp; Algorithmic Pipeline</strong>
        </span>
        <b className="toggle-symbol">{open ? "−" : "+"}</b>
      </button>

      {open && (
        <div className="technical-grid">
          {details.map(([label, value]) => (
            <span key={label}>
              {label}
              <b>{value}</b>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
