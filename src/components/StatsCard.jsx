export default function StatsCard({ label, value, hint, accent = "cyan" }) {
	return <div className={`metric-card accent-${accent}`}><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</div>;
}
