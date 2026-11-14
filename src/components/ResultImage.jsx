import { useRef, useState } from "react";

export default function ResultImage({ title, subtitle, src, alt }) {
	const imageRef = useRef(null);
	const [zoom, setZoom] = useState(1);
	const download = () => { const link = document.createElement("a"); link.href = src; link.download = `${title.toLowerCase().replaceAll(" ", "-")}.jpg`; link.click(); };
	const fullscreen = () => imageRef.current?.requestFullscreen?.();
	return <article className="viewer-card"><div className="viewer-header"><div><span className="eyebrow">OUTPUT</span><h3>{title}</h3><span>{subtitle}</span></div><div className="viewer-actions"><button type="button" title="Zoom out" onClick={() => setZoom(Math.max(1, zoom - 0.25))}>−</button><b>{Math.round(zoom * 100)}%</b><button type="button" title="Zoom in" onClick={() => setZoom(Math.min(2, zoom + 0.25))}>+</button><button type="button" title="Fullscreen" onClick={fullscreen}>□</button><button type="button" title="Download" onClick={download}>↓</button></div></div><div className="image-stage" ref={imageRef}><img src={src} alt={alt} style={{ transform: `scale(${zoom})` }} /></div></article>;
}
