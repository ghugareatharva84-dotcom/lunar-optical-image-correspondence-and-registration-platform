export default function MatchAnalysis({ total = 0, inliers = 0, inlierRatio = 0, algorithm = "LoFTR + USAC_MAGSAC" }) {
  const outliers = Math.max(0, total - inliers);
  const totalSafe = Math.max(total, 1);
  const inlierPct = ((inliers / totalSafe) * 100).toFixed(1);
  const outlierPct = ((outliers / totalSafe) * 100).toFixed(1);

  return (
    <div className="analysis-grid">
      <section className="panel analysis-card">
        <div className="section-top">
          <div>
            <span className="eyebrow">CONSENSUS VERIFICATION</span>
            <h2>Match &amp; Inlier Breakdown</h2>
          </div>
          <span className="chart-legend">
            <i className="inlier-dot" /> Inliers ({inliers}) &nbsp;
            <i className="outlier-dot" /> Outliers ({outliers})
          </span>
        </div>

        <div className="bar-chart">
          <div className="bar-label">
            <span>Geometric inliers (Passed consensus threshold)</span>
            <b className="highlight-green">{inliers} ({inlierPct}%)</b>
          </div>
          <div className="bar-track">
            <i style={{ width: `${inlierPct}%` }} />
          </div>

          <div className="bar-label">
            <span>Parallax / shadow rejected outliers</span>
            <b className="highlight-muted">{outliers} ({outlierPct}%)</b>
          </div>
          <div className="bar-track outlier-track">
            <i style={{ width: `${outlierPct}%` }} />
          </div>
        </div>

        <div className="analysis-foot">
          <span>Active Pipeline: <b>{algorithm}</b></span>
          <span>Verified Inlier Ratio: <b className="highlight-amber">{inlierRatio || inlierPct}%</b></span>
        </div>
      </section>

      <section className="panel quality-summary-card">
        <div className="section-top">
          <div>
            <span className="eyebrow">GEOMETRIC ASSESSMENT</span>
            <h2>Registration Quality</h2>
          </div>
        </div>
        <p>
          High-parallax crater formations create strong shadow variations between lunar orbits. Robust consensus separates genuine surface topography from illumination shifts.
        </p>
        <div className="quality-indicators-grid">
          <div className="quality-pill">
            <span>Inlier Density</span>
            <strong>{inliers > 200 ? "EXCELLENT" : inliers > 50 ? "ROBUST" : "MARGINAL"}</strong>
          </div>
          <div className="quality-pill">
            <span>Contamination Rate</span>
            <strong>{((outliers / totalSafe) * 100).toFixed(1)}%</strong>
          </div>
          <div className="quality-pill">
            <span>Consensus Engine</span>
            <strong>USAC_MAGSAC</strong>
          </div>
        </div>
      </section>
    </div>
  );
}