/** Lightweight vector placeholder, not a photograph of the actual build. */
export function DroneIllustration() {
  return (
    <svg viewBox="0 0 720 490" role="img" aria-labelledby="drone-title drone-desc" className="drone-illustration">
      <title id="drone-title">Schemă ilustrativă a unei drone quadcopter în X</title>
      <desc id="drone-desc">Patru motoare în jurul controlerului ESP32, reprezentate într-un desen tehnic. Geometria este ilustrativă.</desc>
      <defs>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0v30" fill="none" stroke="#fff" strokeOpacity=".065" /></pattern>
        <pattern id="carbon" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v8M4 0v8" stroke="#4d5550" strokeWidth="2" /></pattern>
        <linearGradient id="arm" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#60685f" /><stop offset=".5" stopColor="#272f2b" /><stop offset="1" stopColor="#4b544b" /></linearGradient>
        <linearGradient id="prop" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#9ca898" /><stop offset="1" stopColor="#454e46" /></linearGradient>
      </defs>
      <path fill="url(#grid)" d="M0 0h720v490H0z" />
      <g stroke="#8a9687" fill="none" opacity=".32" strokeWidth="1">
        <circle cx="360" cy="245" r="182" strokeDasharray="4 7" /><circle cx="360" cy="245" r="124" />
        <path d="M360 32v426M116 245h488" strokeDasharray="5 7" />
        <path d="M147 63v365m426-365v365M143 70h434M143 420h434M147 66v8m426-8v8" />
      </g>
      <g transform="translate(360 245) rotate(-20) scale(1 .82)">
        <g stroke="#111915" strokeWidth="40" strokeLinecap="round"><path d="m-142-142 284 284m0-284-284 284" /></g>
        <g stroke="url(#arm)" strokeWidth="30" strokeLinecap="round"><path d="m-142-142 284 284m0-284-284 284" /></g>
        <g stroke="#e5683d" fill="none" strokeWidth="2"><path d="M-142-142-17-10 142-142M-142 142 17 10 142 142" /></g>
        {[[ -142, -142 ], [ 142, -142 ], [ -142, 142 ], [ 142, 142 ]].map(([x,y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r="76" fill="none" stroke="#b8c8ae" strokeOpacity=".17" strokeDasharray="3 5" />
            <circle r="25" fill="#121a15" stroke="#74816d" strokeWidth="2" /><circle r="19" fill="#424e3d" />
            <g transform={`rotate(${i % 2 ? 35 : -35})`}>
              <path d="M-5-6C-23-17-78-14-78-2c0 12 51 15 73 8M5 6C23 17 78 14 78 2c0-12-51-15-73-8" fill="url(#prop)" stroke="#a1ae96" strokeWidth=".8" />
              <path d="M-68-3-11-1M11 1l57 2" stroke="#c1cdb6" strokeOpacity=".5" />
            </g>
            <circle r="9" fill="#171f18" stroke="#8b997d" strokeWidth="2" /><circle r="3" fill="#bdc9b1" />
          </g>
        ))}
        <path d="m-47-77 94 0 21 30v94L47 77h-94l-21-30v-94z" fill="#161f19" stroke="#6f7c65" strokeWidth="2" />
        <path d="m-41-70 82 0 19 28v84L41 70h-82l-19-28v-84z" fill="url(#carbon)" opacity=".55" />
        {[[-46,-48],[46,-48],[-46,48],[46,48]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="4" fill="#bdc6b7" stroke="#121910" strokeWidth="2" />)}
        <rect x="-31" y="-49" width="62" height="98" rx="5" fill="#4f6043" stroke="#849575" />
        <rect x="-22" y="-32" width="44" height="42" rx="2" fill="#b5bcb1" stroke="#e2e7dc" />
        <text x="0" y="-7" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#263020">ESP32</text>
        <path d="M-19 24h38m-38 6h38m-38 6h38" stroke="#9eae87" strokeWidth="2" />
        <rect x="-37" y="-4" width="9" height="19" rx="2" fill="#ed7645" />
        <circle cx="22" cy="-39" r="2" fill="#e5a854" />
        <path d="M0-53v-38m-10 8 10-10 10 10" fill="none" stroke="#e87b4e" strokeWidth="2" />
      </g>
      <g fill="#c5cec0" fontFamily="monospace" fontSize="10" letterSpacing="1">
        <text x="41" y="137">M1 / CCW</text><text x="561" y="95">M2 / CW</text>
        <text x="88" y="414">M3 / CW</text><text x="576" y="363">M4 / CCW</text>
        <text x="367" y="49" fill="#e98b61">FRONT ↑</text>
      </g>
      <g stroke="#9cab94" strokeWidth="1" fill="none" opacity=".6"><path d="M120 134h27l34 39M560 98h-35l-26 24M151 405h31l31-37M572 358h-29l-28-17" /></g>
      <g fill="#e98b61"><circle cx="181" cy="173" r="2" /><circle cx="499" cy="122" r="2" /><circle cx="213" cy="368" r="2" /><circle cx="515" cy="341" r="2" /></g>
    </svg>
  );
}
