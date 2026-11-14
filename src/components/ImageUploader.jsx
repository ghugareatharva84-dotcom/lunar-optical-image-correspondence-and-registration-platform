import { useEffect, useRef, useState } from "react";

const ACCEPTED = ["image/jpeg", "image/png", "image/bmp", "image/tiff"];

function formatBytes(bytes) {
	if (!bytes) return "0 KB";
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageUploader({ label, file, preview, sensor, onChange, onRemove }) {
	const inputRef = useRef(null);
	const [dragging, setDragging] = useState(false);
	const [dimensions, setDimensions] = useState(null);
	const [invalid, setInvalid] = useState("");

	useEffect(() => {
		if (!preview) {
			return undefined;
		}
		const image = new Image();
		image.onload = () => setDimensions(`${image.naturalWidth} × ${image.naturalHeight}`);
		image.src = preview;
		return () => { image.onload = null; };
	}, [preview]);

	const selectFile = (selected) => {
		if (!selected) return;
		if (!ACCEPTED.includes(selected.type) && !/\.(jpe?g|png|bmp|tiff?)$/i.test(selected.name)) {
			setInvalid("Unsupported format. Use JPG, PNG, BMP or TIFF.");
			return;
		}
		setInvalid("");
		onChange(selected);
	};

	return (
		<article className="upload-card">
			<div className="card-heading"><div><span className="eyebrow">INPUT {label === "Source Image" ? "01" : "02"}</span><h2>{label}</h2></div><span className="format-note">JPG · PNG · TIFF</span></div>
			<div className={`drop-zone ${dragging ? "is-dragging" : ""} ${file ? "has-file" : ""}`}
				onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
				onDragLeave={() => setDragging(false)}
				onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }}
				onClick={() => inputRef.current?.click()}>
				{preview ? <img className="preview-image" src={preview} alt={`${label} preview`} /> : <>
					<span className="upload-icon">+</span><strong>Drop {label.toLowerCase()} here</strong><span>or click to browse local files</span>
				</>}
				<input ref={inputRef} hidden type="file" accept=".jpg,.jpeg,.png,.bmp,.tif,.tiff,image/*" onChange={(event) => selectFile(event.target.files[0])} />
			</div>
			{invalid && <p className="field-error">{invalid}</p>}
			{file && <div className="file-details">
				<div className="file-title"><span className="file-badge">IMG</span><strong title={file.name}>{file.name}</strong></div>
				<div className="file-actions"><button type="button" onClick={() => inputRef.current?.click()}>Replace</button><button type="button" className="quiet-danger" onClick={onRemove}>Remove</button></div>
				<dl><div><dt>Resolution</dt><dd>{dimensions || "Reading..."}</dd></div><div><dt>Format</dt><dd>{file.name.split(".").pop().toUpperCase()}</dd></div><div><dt>Size</dt><dd>{formatBytes(file.size)}</dd></div><div><dt>Color</dt><dd>Not available</dd></div><div><dt>Bit Depth</dt><dd>Not available</dd></div><div><dt>Sensor</dt><dd>{sensor || "Unknown"}</dd></div></dl>
			</div>}
		</article>
	);
}
