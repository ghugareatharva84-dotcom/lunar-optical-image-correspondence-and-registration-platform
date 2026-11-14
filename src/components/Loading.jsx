export default function Loading({ stage }) {
	return <div className="processing-banner"><span className="spinner" /><div><strong>{stage}</strong><span>Live registration pipeline is running. Keep this window open.</span></div><span className="processing-pulse">PROCESSING</span></div>;
}
