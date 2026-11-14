import { useState } from "react";

export default function HomographyMatrix({ matrix }) {
  const [open, setOpen] = useState(false);
  return <section className="panel homography-panel"><div className="section-top"><div><span className="eyebrow">TRANSFORMATION MODEL</span><h2>Homography Matrix</h2></div><button type="button" className="detail-toggle" onClick={() => setOpen(!open)}>{open ? "Hide details" : "View transformation details"} <b>↗</b></button></div>{open && <><div className="matrix">{(matrix || []).map((row, rowIndex) => <div key={rowIndex}>{row.map((value, columnIndex) => <span key={`${rowIndex}-${columnIndex}`}>{Number(value).toFixed(5)}</span>)}</div>)}</div><p>Homography describes the geometric transformation used to map the source image onto the reference image.</p></>}</section>;
}
