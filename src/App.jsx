import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import ImageUploader from "./components/ImageUploader";
import Loading from "./components/Loading";
import ResultImage from "./components/ResultImage";
import StatsCard from "./components/StatsCard";
import ProcessingPipeline from "./components/ProcessingPipeline";
import SensorSelector from "./components/SensorSelector";
import ConfidenceScore from "./components/ConfidenceScore";
import MatchAnalysis from "./components/MatchAnalysis";
import ErrorPanel from "./components/ErrorPanel";
import DifferenceMap from "./components/DifferenceMap";
import SpatialDistribution from "./components/SpatialDistribution";
import HomographyMatrix from "./components/HomographyMatrix";
import TechnicalDetails from "./components/TechnicalDetails";
import RegistrationHistory from "./components/RegistrationHistory";
import ScrollCanvasBackground from "./components/ScrollCanvasBackground";
import { registerImages, resultUrl, getSamples, fetchSampleBlob, checkHealth } from "./services/api";
import "./index.css";
import "./App.css";

const loftrProcessingStages = [
  "INITIALIZING CHANDRAYAAN PIPELINE...",
  "PREPROCESSING & CLAHE CONTRAST NORMALIZATION...",
  "EXTRACTING FEATURE PYRAMIDS (ResNet-FPN)...",
  "EXECUTING DENSE ATTENTION TRANSFORMER...",
  "ESTABLISHING COARSE-TO-FINE CORRESPONDENCE...",
  "RUNNING USAC_MAGSAC ROBUST HOMOGRAPHY...",
  "CALCULATING CONVEX HULL & SPATIAL ENTROPY...",
  "COMPUTING RESIDUAL ERROR & WARP PROJECTION...",
  "FINALIZING FLIGHT TELEMETRY METRICS...",
];

const siftProcessingStages = [
  "INITIALIZING CHANDRAYAAN PIPELINE...",
  "PREPROCESSING & CONTRAST NORMALIZATION...",
  "DETECTING SCALE-SPACE EXTREMA...",
  "COMPUTING 128-D SIFT DESCRIPTORS...",
  "RUNNING FLANN / LOWE RATIO TEST (0.75)...",
  "ESTIMATING HOMOGRAPHY WITH USAC_MAGSAC...",
  "CALCULATING SPATIAL DISTRIBUTION & CONVEX HULL...",
  "REGISTERING LUNAR FRAME & METRICS...",
  "FINALIZING FLIGHT TELEMETRY METRICS...",
];

function App() {
  const [source, setSource] = useState(null);
  const [reference, setReference] = useState(null);
  const [sourcePreview, setSourcePreview] = useState("");
  const [referencePreview, setReferencePreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState(0);
  const [sensor, setSensor] = useState("OHRC");
  const [algorithm, setAlgorithm] = useState("LOFTR_MAGSAC");
  const [sourceAngle, setSourceAngle] = useState(45);
  const [referenceAngle, setReferenceAngle] = useState(30);
  const [comparison, setComparison] = useState(50);
  const [historyKey, setHistoryKey] = useState(0);
  const [backendStatus, setBackendStatus] = useState("CHECKING");
  const resultsRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    checkHealth()
      .then((data) => {
        if (isMounted) {
          setBackendStatus(data?.api_status === "ONLINE" ? "ONLINE" : "READY");
        }
      })
      .catch(() => {
        if (isMounted) {
          setBackendStatus("OFFLINE");
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => () => {
    if (sourcePreview && sourcePreview.startsWith("blob:")) URL.revokeObjectURL(sourcePreview);
    if (referencePreview && referencePreview.startsWith("blob:")) URL.revokeObjectURL(referencePreview);
  }, [sourcePreview, referencePreview]);

  const chooseFile = (file, type) => {
    const preview = URL.createObjectURL(file);
    if (type === "source") {
      setSource(file);
      setSourcePreview(preview);
    } else {
      setReference(file);
      setReferencePreview(preview);
    }
  };

  const removeFile = (type) => {
    if (type === "source") {
      setSource(null);
      setSourcePreview("");
    } else {
      setReference(null);
      setReferencePreview("");
    }
  };

  const loadChandrayaanSample = async () => {
    try {
      setSampleLoading(true);
      setError("");
      const data = await getSamples();
      const srcInfo = data?.source || (data?.samples && data.samples[0]);
      const refInfo = data?.reference || (data?.samples && data.samples[1]);

      if (srcInfo && refInfo) {
        const srcPath = srcInfo.url || srcInfo.path;
        const refPath = refInfo.url || refInfo.path;
        const [srcBlob, refBlob] = await Promise.all([
          fetchSampleBlob(srcPath),
          fetchSampleBlob(refPath)
        ]);
        const srcFile = new File([srcBlob], srcInfo.filename || srcInfo.name || "chandrayaan_source.png", { type: "image/png" });
        const refFile = new File([refBlob], refInfo.filename || refInfo.name || "chandrayaan_ref.png", { type: "image/png" });
        chooseFile(srcFile, "source");
        chooseFile(refFile, "reference");
      } else {
        throw new Error("Sample crater images not found on server.");
      }
    } catch (err) {
      console.error("Failed loading sample images:", err);
      setError("Could not load sample crater images. Ensure the backend server is running.");
    } finally {
      setSampleLoading(false);
    }
  };

  const friendlyError = (err) => {
    if (err.code === "ECONNABORTED") {
      return "Registration timed out. Try SIFT + MAGSAC mode or closer overlapping regions.";
    }
    if (!err.response) {
      return "Backend is offline or the network connection was interrupted. Please ensure the backend is running.";
    }

    const status = err.response.status;
    const detail = err.response.data?.detail || "";

    if (status === 400) {
      if (typeof detail === "string" && (detail.includes("Not enough") || detail.includes("insufficient"))) {
        return "Insufficient Correspondences: Fewer than 4 geometrically valid feature points were identified between source and reference frames. Try using LoFTR Transformer.";
      }
      return `Image registration failed: ${detail}`;
    }

    if (status === 500) {
      return `Server error: ${detail || "Internal processing error occurred."}`;
    }

    if (typeof detail === "string" && detail.length > 0) {
      return detail;
    }

    return "Registration failed. Please check both images and try again.";
  };

  const currentStages = algorithm.includes("LOFTR") ? loftrProcessingStages : siftProcessingStages;

  const register = async () => {
    if (!source || !reference) {
      setError("Please select both a source image and a reference image before starting.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setStage(0);
    const timer = window.setInterval(() => {
      setStage((curr) => Math.min(curr + 1, currentStages.length - 1));
    }, 1200);

    try {
      const data = await registerImages(source, reference, {
        algorithm,
        source_sensor: sensor,
        reference_sensor: sensor,
        apply_clahe: true,
      });

      if (typeof data?.total_matches !== "number" || typeof data?.inlier_count !== "number") {
        throw new Error("Unexpected API response structure.");
      }

      setResult(data);
      setHistoryKey((prev) => prev + 1); // Trigger history re-fetch
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err.message === "Unexpected API response structure." ? err.message : friendlyError(err));
    } finally {
      window.clearInterval(timer);
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!result) return;
    const report = {
      source_filename: result.source_filename,
      reference_filename: result.reference_filename,
      sensor,
      algorithm: result.algorithm,
      source_shape: result.source_shape,
      reference_shape: result.reference_shape,
      total_matches: result.total_matches,
      inliers: result.inlier_count,
      outliers: result.total_matches - result.inlier_count,
      inlier_ratio: result.inlier_ratio,
      rmse: result.rmse,
      processing_time: result.processing_time,
      confidence_score: result.confidence_score,
      confidence_level: result.confidence_level,
      spatial_metrics: result.spatial_metrics,
      homography: result.homography,
      timestamp: new Date().toISOString(),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `chandrayaan-registration-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      {/* PROTECTED: Original scroll-driven canvas background */}
      <ScrollCanvasBackground />

      <Navbar />

      <main>
        <section className="hero">
          <div className="hero-kicker"><span /> CHANDRAYAAN MISSION CONTROL / IMAGE REGISTRATION</div>
          <h1>Lunar Image <em>Correspondence</em><br />&amp; Registration</h1>
          <p>
            Sub-pixel optical image registration for Chandrayaan-2 orbiter imagery. Powered by deep attention transformers (LoFTR) and classical scale-invariant detectors (SIFT) with USAC_MAGSAC consensus verification.
          </p>
          <div className="hero-tags">
            <span>LoFTR TRANSFORMER</span>
            <span>SIFT + USAC_MAGSAC</span>
            <span>HOMOGRAPHY WARP</span>
            <span>CONVEX HULL TELEMETRY</span>
            <span style={{ color: backendStatus === "ONLINE" ? "#3fb950" : "#ff7b72" }}>
              ● API: {backendStatus}
            </span>
          </div>
        </section>

        <div className="workspace-grid">
          <section className="input-column">
            <div className="section-title">
              <div>
                <span className="eyebrow">01 / ACQUISITION</span>
                <h2>Image Inputs</h2>
              </div>
              <span className="section-note">TWO-FRAME REGISTRATION</span>
            </div>

            {/* Quick Demo Sample Loader */}
            <div className="sample-load-bar">
              <div className="sample-load-info">
                <strong>Chandrayaan-2 Optical Sensor Demo Frames</strong>
                <small>Pre-staged lunar crater pair (Boguslawsky crater / South Pole terrain)</small>
              </div>
              <button
                type="button"
                className="sample-load-btn"
                onClick={loadChandrayaanSample}
                disabled={sampleLoading || loading}
              >
                <span>{sampleLoading ? "◌ FETCHING LUNAR DATA..." : "⚡ LOAD CHANDRAYAAN-2 SAMPLE CRATER PAIR"}</span>
              </button>
            </div>

            <div className="upload-section">
              <ImageUploader
                label="Source Image"
                file={source}
                preview={sourcePreview}
                sensor={sensor}
                onChange={(file) => chooseFile(file, "source")}
                onRemove={() => removeFile("source")}
              />
              <ImageUploader
                label="Reference Image"
                file={reference}
                preview={referencePreview}
                sensor={sensor}
                onChange={(file) => chooseFile(file, "reference")}
                onRemove={() => removeFile("reference")}
              />
            </div>

            <div className="controls-row">
              <SensorSelector value={sensor} onChange={setSensor} />

              {/* Algorithm Selector */}
              <section className="control-panel panel algorithm-panel">
                <div className="section-top">
                  <div>
                    <span className="eyebrow">MISSION ALGORITHM</span>
                    <h2>Correspondence Engine</h2>
                  </div>
                  <span className="algorithm-badge">
                    {algorithm.includes("LOFTR") ? "DEEP TRANSFORMER" : "SCALE-SPACE SIFT"}
                  </span>
                </div>
                <div className="algorithm-options">
                  <button
                    type="button"
                    className={`algo-btn ${algorithm === "LOFTR_MAGSAC" ? "active" : ""}`}
                    onClick={() => setAlgorithm("LOFTR_MAGSAC")}
                  >
                    <span className="algo-name">LoFTR + USAC_MAGSAC</span>
                    <small className="algo-desc">Detector-free attention transformer · Best for lunar craters &amp; shadows</small>
                  </button>
                  <button
                    type="button"
                    className={`algo-btn ${algorithm === "SIFT_MAGSAC" ? "active" : ""}`}
                    onClick={() => setAlgorithm("SIFT_MAGSAC")}
                  >
                    <span className="algo-name">SIFT + USAC_MAGSAC</span>
                    <small className="algo-desc">Scale-invariant detector + marginalizing sample consensus</small>
                  </button>
                  <button
                    type="button"
                    className={`algo-btn ${algorithm === "SIFT_RANSAC" ? "active" : ""}`}
                    onClick={() => setAlgorithm("SIFT_RANSAC")}
                  >
                    <span className="algo-name">SIFT + RANSAC</span>
                    <small className="algo-desc">Standard Lowe ratio (0.75) + classical RANSAC baseline</small>
                  </button>
                  <button
                    type="button"
                    className={`algo-btn ${algorithm === "ORB_RANSAC" ? "active" : ""}`}
                    onClick={() => setAlgorithm("ORB_RANSAC")}
                  >
                    <span className="algo-name">ORB + RANSAC</span>
                    <small className="algo-desc">Fast binary oriented FAST and rotated BRIEF</small>
                  </button>
                </div>
              </section>

              <section className="control-panel panel conditions">
                <div className="section-top">
                  <div>
                    <span className="eyebrow">MISSION PARAMETERS</span>
                    <h2>Image Conditions</h2>
                  </div>
                  <span className="control-icon">◌</span>
                </div>
                <label>
                  Source Sun Angle <output>{sourceAngle}°</output>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={sourceAngle}
                    onChange={(event) => setSourceAngle(Number(event.target.value))}
                  />
                </label>
                <label>
                  Reference Sun Angle <output>{referenceAngle}°</output>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={referenceAngle}
                    onChange={(event) => setReferenceAngle(Number(event.target.value))}
                  />
                </label>
                <div className="condition-pills">
                  <span>Scale <b>1.0×</b></span>
                  <span>CLAHE <b>Active</b></span>
                  <span>Viewpoint <b>Nadir</b></span>
                </div>
              </section>
            </div>
          </section>

          <aside className="mission-aside">
            <div className="aside-card">
              <span className="eyebrow">ACTIVE PIPELINE</span>
              <h3>Dual Correspondence Engines</h3>
              <div className="algorithm-line">
                <b>01</b>
                <span>LoFTR Attention Transformer (ISRO benchmark)</span>
              </div>
              <div className="algorithm-line">
                <b>02</b>
                <span>SIFT + USAC_MAGSAC (Sub-pixel consensus)</span>
              </div>
              <div className="algorithm-line">
                <b>03</b>
                <span>Convex Hull + Spatial Shannon Entropy</span>
              </div>
              <div className="algorithm-line">
                <b>04</b>
                <span>Multi-factor AI Flight Reliability Scoring</span>
              </div>
            </div>

            <div className="aside-card future">
              <span className="eyebrow">FLIGHT METRICS</span>
              <h3>Empirical Validation</h3>
              <p>
                Real reprojection RMSE, OpenCV convex hull footprint %, inlier ratio, and matrix condition numbers evaluated at runtime.
              </p>
              <span className="planned" style={{ background: "rgba(111, 230, 223, 0.15)", color: "var(--cyan)", border: "1px solid var(--cyan)" }}>
                VERIFIED REAL
              </span>
            </div>
          </aside>
        </div>

        <ProcessingPipeline
          active={loading ? stage : result ? currentStages.length : 0}
          loading={loading}
          completed={Boolean(result && !loading)}
          failed={Boolean(error && !loading)}
        />

        {loading && <Loading stage={currentStages[stage]} />}

        <div className="launch-row">
          <div>
            <span className="eyebrow">READY STATE</span>
            <p>
              {source && reference
                ? `Both frames staged for geometric analysis using ${algorithm}.`
                : "Awaiting source and reference frames."}
            </p>
          </div>
          <button className="launch-button" onClick={register} disabled={loading}>
            <span>{loading ? "PROCESSING..." : "START REGISTRATION"}</span>
            <b>→</b>
          </button>
        </div>

        {error && <ErrorPanel message={error} onRetry={register} />}

        {result && (
          <section className="results" ref={resultsRef}>
            <div className="results-heading">
              <div>
                <span className="eyebrow">02 / ANALYSIS COMPLETE</span>
                <h2>Registration Results</h2>
              </div>
              <span className="success-chip">
                <i /> REGISTRATION SUCCESSFUL ({result.algorithm || algorithm})
              </span>
            </div>

            {/* Real Metrics Cards */}
            <div className="metrics">
              <StatsCard label="Total Matches" value={result.total_matches} hint="Feature correspondences" />
              <StatsCard label="Inliers" value={result.inlier_count} hint="Validated consensus matches" accent="green" />
              <StatsCard label="Outliers" value={Math.max(0, result.total_matches - result.inlier_count)} hint="Parallax/shadow rejected" accent="muted" />
              <StatsCard label="Inlier Ratio" value={`${result.inlier_ratio}%`} hint="Geometric agreement" accent="amber" />
              <StatsCard label="RMSE" value={result.rmse == null ? "N/A" : `${result.rmse} px`} hint="Reprojection residual" accent="muted" />
              <StatsCard label="Processing Time" value={result.processing_time == null ? "N/A" : `${result.processing_time}s`} hint="Real backend execution" accent="green" />
              <StatsCard label="Reliability" value={result.confidence_level || (result.inlier_ratio >= 75 ? "HIGH" : "MEDIUM")} hint={`${result.confidence_score || result.inlier_ratio}% empirical score`} accent="green" />
            </div>

            {/* Multi-Factor AI Confidence Score */}
            <ConfidenceScore
              score={result.confidence_score}
              level={result.confidence_level}
              supportingFactors={result.confidence_data?.supporting_factors}
              detractors={result.confidence_data?.detractors}
              warnings={result.confidence_data?.warnings}
              ratio={result.inlier_ratio}
            />

            {/* Visualizer Views */}
            <div className="viewer-grid">
              <ResultImage
                title="Feature Correspondence"
                subtitle="Consensus-validated feature matches across frames"
                src={resultUrl(result.match_visualization || result.match_image_url)}
                alt="Feature match visualization"
              />
              <ResultImage
                title="Registered Image"
                subtitle="Perspective homography warped source to reference frame"
                src={resultUrl(result.registered_image || result.registered_image_url)}
                alt="Registered lunar image"
              />
            </div>

            {/* Drag Divider Comparison */}
            <section className="comparison panel">
              <div className="section-top">
                <div>
                  <span className="eyebrow">VISUAL VERIFICATION</span>
                  <h2>Before / After Comparison</h2>
                </div>
                <span className="section-note">DRAG DIVIDER</span>
              </div>
              <div className="comparison-stage">
                <img
                  src={resultUrl(result.registered_image || result.registered_image_url)}
                  alt="Registered comparison"
                />
                <div
                  className="comparison-before"
                  style={{ clipPath: `inset(0 ${100 - comparison}% 0 0)` }}
                >
                  <img
                    src={sourcePreview || resultUrl(result.source_image_url || result.registered_image)}
                    alt="Source comparison"
                  />
                </div>
                <div
                  className="comparison-divider-line"
                  style={{ left: `${comparison}%` }}
                />
                <input
                  aria-label="Comparison divider"
                  type="range"
                  min="0"
                  max="100"
                  value={comparison}
                  onChange={(event) => setComparison(event.target.value)}
                />
              </div>
              <div className="comparison-labels">
                <span>Source Image</span>
                <span>Registered Image</span>
              </div>
            </section>

            {/* Feature Match Breakdown */}
            <MatchAnalysis
              total={result.total_matches}
              inliers={result.inlier_count}
              inlierRatio={result.inlier_ratio}
              algorithm={result.algorithm || algorithm}
            />

            {/* Normalized Difference Heatmap */}
            <DifferenceMap
              src={resultUrl(result.difference_map || result.difference_map_url)}
              meanError={result.mean_error}
              maxError={result.max_error}
              rmse={result.difference_rmse || result.rmse}
            />

            {/* Spatial Convex Hull & Quadrant Distribution */}
            <SpatialDistribution
              points={result.reference_points}
              referencePreview={referencePreview || (result.reference_image_url ? resultUrl(result.reference_image_url) : "")}
              spatialMetrics={result.spatial_metrics}
            />

            {/* Perspective Homography Matrix */}
            <HomographyMatrix matrix={result.homography} />

            {/* Metadata Panel */}
            <section className="sensor-summary panel">
              <span className="eyebrow">DATASET METADATA</span>
              <h2>Analysis Sensors</h2>
              <div>
                <span>Source Sensor <b>{result.source_sensor || sensor}</b></span>
                <span>Reference Sensor <b>{result.reference_sensor || sensor}</b></span>
                <span>
                  Source Dimensions <b>{result.source_shape?.slice(0, 2).join(" × ") || "N/A"}</b>
                </span>
                <span>
                  Reference Dimensions <b>{result.reference_shape?.slice(0, 2).join(" × ") || "N/A"}</b>
                </span>
              </div>
            </section>

            {/* Technical Specifications */}
            <TechnicalDetails algorithm={result.algorithm || algorithm} result={result} />

            {/* Export Actions */}
            <div className="export-row">
              <button type="button" onClick={exportReport}>
                ↓ Export Analysis Report (JSON)
              </button>
              <a href={resultUrl(result.registered_image || result.registered_image_url)} download="registered_frame.png">
                ↓ Download Registered Image
              </a>
              <a href={resultUrl(result.match_visualization || result.match_image_url)} download="match_visualization.png">
                ↓ Download Match Visualization
              </a>
              <a href={resultUrl(result.difference_map || result.difference_map_url)} download="difference_map.png">
                ↓ Download Difference Map
              </a>
            </div>
          </section>
        )}

        {/* Real Registration History with Deep Inspection */}
        <RegistrationHistory
          key={historyKey}
          onSelectRecord={(pastRecord) => {
            setResult(pastRecord);
            if (pastRecord.source_image_url) {
              setSourcePreview(resultUrl(pastRecord.source_image_url));
            }
            if (pastRecord.reference_image_url) {
              setReferencePreview(resultUrl(pastRecord.reference_image_url));
            }
            window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
          }}
        />
      </main>

      <footer>
        <span>Front End - Atharva Ghugare · Back End - Shravani Ghag</span>
        <span>Sub-pixel optical image correspondence platform · Flight Telemetry &amp; Analysis</span>
      </footer>
    </div>
  );
}

export default App;
