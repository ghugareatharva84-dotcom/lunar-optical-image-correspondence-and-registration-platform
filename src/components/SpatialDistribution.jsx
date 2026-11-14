export default function SpatialDistribution({ points, referencePreview, spatialMetrics }) {
  const validPoints = Array.isArray(points) ? points : [];
  
  // Calculate boundary if not provided
  const maxX = validPoints.reduce((max, point) => Math.max(max, point[0] || 0), 1);
  const maxY = validPoints.reduce((max, point) => Math.max(max, point[1] || 0), 1);

  const hullCoverage = spatialMetrics?.convex_hull_coverage_pct ?? null;
  const entropy = spatialMetrics?.spatial_entropy ?? null;
  const quadrants = spatialMetrics?.quadrants ?? null;

  return (
    <section className="panel spatial-visual">
      <div className="section-top">
        <div>
          <span className="eyebrow">GEOMETRIC COVERAGE &amp; DISPERSION</span>
          <h2>Spatial Match Distribution</h2>
        </div>
        <span className="section-note">
          {validPoints.length} INLIERS VERIFIED
        </span>
      </div>

      <p>
        Uniform spatial distribution across crater topography ensures the homography matrix is not skewed by clustered local crater rim features.
      </p>

      {/* Spatial Metrics Telemetry Strip */}
      <div className="spatial-telemetry-grid">
        <div className="spatial-stat-box">
          <span className="stat-label">Convex Hull Footprint</span>
          <strong className="stat-value highlight-cyan">
            {hullCoverage !== null ? `${hullCoverage}%` : "Calculating..."}
          </strong>
          <small className="stat-sub">Surface area encompassed</small>
        </div>

        <div className="spatial-stat-box">
          <span className="stat-label">Spatial Entropy</span>
          <strong className="stat-value highlight-amber">
            {entropy !== null ? entropy.toFixed(3) : "Calculating..."}
          </strong>
          <small className="stat-sub">1.00 = Perfectly uniform</small>
        </div>

        <div className="spatial-stat-box quadrant-box">
          <span className="stat-label">Quadrant Distribution</span>
          {quadrants ? (
            <div className="quadrant-chips">
              <span title="Top-Left">NW: <b>{quadrants.Q1_top_left}%</b></span>
              <span title="Top-Right">NE: <b>{quadrants.Q2_top_right}%</b></span>
              <span title="Bottom-Left">SW: <b>{quadrants.Q3_bottom_left}%</b></span>
              <span title="Bottom-Right">SE: <b>{quadrants.Q4_bottom_right}%</b></span>
            </div>
          ) : (
            <span className="stat-sub">Balanced distribution</span>
          )}
        </div>
      </div>

      {/* Interactive Overlay Stage */}
      <div className="distribution-stage">
        {referencePreview ? (
          <img src={referencePreview} alt="Reference frame with inlier distribution" />
        ) : (
          <div className="distribution-placeholder-grid" />
        )}
        
        {/* Quadrant grid crosshairs */}
        <div className="quadrant-crosshair vertical" />
        <div className="quadrant-crosshair horizontal" />

        {validPoints.map(([x, y], index) => (
          <i
            key={`pt-${x}-${y}-${index}`}
            title={`Inlier (${Math.round(x)}, ${Math.round(y)})`}
            style={{
              left: `${(x / maxX) * 92 + 4}%`,
              top: `${(y / maxY) * 88 + 6}%`,
            }}
          />
        ))}

        {!validPoints.length && (
          <div className="distribution-empty">
            <strong>Spatial distribution data</strong>
            <span>Coordinate telemetry will appear once registration completes.</span>
          </div>
        )}
      </div>

      <small className="distribution-note">
        Cyan reticles represent USAC_MAGSAC inlier coordinates projected onto the reference coordinate frame.
      </small>
    </section>
  );
}
