export default function Navbar() {
	return (
		<nav className="navbar">
			<div className="brand-lockup">
				<div className="brand-mark">LR</div>
				<div>
					<strong>Lunar Image Registration</strong>
					<span>Chandrayaan-2 · AI Correspondence &amp; Registration</span>
				</div>
			</div>
			<div className="nav-meta">
				<span className="online"><i /> System Status: ONLINE</span>
				<span className="mission">Mission: <b>CHANDRAYAAN-2</b></span>
			</div>
		</nav>
	);
}
