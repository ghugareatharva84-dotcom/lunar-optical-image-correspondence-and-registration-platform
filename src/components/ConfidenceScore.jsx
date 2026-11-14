export default function ConfidenceScore({ 
  score = 0, 
  level = "LOW", 
  supportingFactors = [], 
  detractors = [], 
  warnings = [],
  ratio = 0 
}) {
  const displayScore = Math.round(score || ratio || 0);
  const normalizedLevel = (level || (displayScore >= 80 ? "HIGH" : displayScore >= 55 ? "MEDIUM" : "LOW")).toUpperCase();
  const levelClass = normalizedLevel.toLowerCase();

  return (
    <div className={`confidence-card ${levelClass}`}>
      <div className="confidence-ring" style={{ "--score": `${Math.min(100, Math.max(0, displayScore)) * 3.6}deg` }}>
        <strong>{displayScore}<small>%</small></strong>
      </div>
      <div className="confidence-body">
        <div className="confidence-header">
          <span className="eyebrow">AI REGISTRATION CONFIDENCE</span>
          <div className="confidence-title-row">
            <h3 className="confidence-level">{normalizedLevel} RELIABILITY</h3>
            <span className={`confidence-badge badge-${levelClass}`}>
              {normalizedLevel === "HIGH" ? "FLIGHT READY" : normalizedLevel === "MEDIUM" ? "SUB-OPTIMAL" : "CRITICAL WARNING"}
            </span>
          </div>
        </div>

        <p className="confidence-explanation">
          Empirically evaluated from geometric consensus, inlier dispersion, convex hull footprint, and reprojection residual.
        </p>

        {supportingFactors && supportingFactors.length > 0 && (
          <div className="factors-group supporting">
            <span className="factor-header">✓ VALIDATING FACTORS:</span>
            <ul className="factors-list">
              {supportingFactors.map((factor, i) => (
                <li key={`sup-${i}`}>{factor}</li>
              ))}
            </ul>
          </div>
        )}

        {detractors && detractors.length > 0 && (
          <div className="factors-group detractors">
            <span className="factor-header">⚠ QUALITY DETRACTORS:</span>
            <ul className="factors-list">
              {detractors.map((factor, i) => (
                <li key={`det-${i}`}>{factor}</li>
              ))}
            </ul>
          </div>
        )}

        {warnings && warnings.length > 0 && (
          <div className="factors-group warnings">
            <span className="factor-header">! MISSION DIAGNOSTICS:</span>
            <ul className="factors-list">
              {warnings.map((warn, i) => (
                <li key={`warn-${i}`}>{warn}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}