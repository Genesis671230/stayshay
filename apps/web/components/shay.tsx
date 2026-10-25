/**
 * Shay — the Stayshay assistant mascot: the brand pin with a face. Blinks every few seconds, waves its hand
 * (on a timer, and continuously while `waving`), floats gently, and opens its mouth while `talking`.
 * Pure SVG + CSS (keyframes in globals.css), so it works in any page without images.
 */
export function Shay({ size = 64, waving = false, talking = false, className = "" }: { size?: number; waving?: boolean; talking?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 140 150"
      width={size}
      height={(size * 150) / 140}
      className={`shay ${waving ? "shay-waving" : ""} ${talking ? "shay-talking" : ""} ${className}`}
      role="img"
      aria-label="Shay, the Stayshay assistant"
    >
      <g className="shay-float">
        {/* waving arm (behind the body) */}
        <g className="shay-arm">
          <path d="M98 70 Q114 62 120 44" stroke="#145C46" strokeWidth="9" strokeLinecap="round" fill="none" />
          <circle cx="121" cy="40" r="9.5" fill="#145C46" />
          <circle cx="121" cy="40" r="4.2" fill="#27AE78" opacity=".55" />
        </g>
        {/* pin body */}
        <path d="M44 98 Q60 120 70 142 Q80 120 96 98Z" fill="#145C46" />
        <circle cx="70" cy="62" r="44" fill="#145C46" />
        <circle cx="70" cy="62" r="44" fill="url(#shay-shine)" />
        {/* cheeks */}
        <ellipse cx="44" cy="76" rx="7" ry="4.5" fill="#F7A8A0" opacity=".55" />
        <ellipse cx="96" cy="76" rx="7" ry="4.5" fill="#F7A8A0" opacity=".55" />
        {/* eyes */}
        <g className="shay-eyes">
          <g className="shay-eye">
            <ellipse cx="53" cy="58" rx="11" ry="13" fill="#FFFFFF" />
            <circle className="shay-pupil" cx="55" cy="60" r="6.5" fill="#202B27" />
            <circle cx="57.5" cy="56.5" r="2.4" fill="#FFFFFF" />
          </g>
          <g className="shay-eye">
            <ellipse cx="87" cy="58" rx="11" ry="13" fill="#FFFFFF" />
            <circle className="shay-pupil" cx="89" cy="60" r="6.5" fill="#202B27" />
            <circle cx="91.5" cy="56.5" r="2.4" fill="#FFFFFF" />
          </g>
        </g>
        {/* mouth: smile, or an open "talking" mouth */}
        <path className="shay-smile" d="M60 80 Q70 89 80 80" stroke="#DDF4E8" strokeWidth="4.2" strokeLinecap="round" fill="none" />
        <ellipse className="shay-mouth" cx="70" cy="83" rx="7" ry="5" fill="#0C3A2C" />
      </g>
      <ellipse cx="70" cy="146" rx="15" ry="3" fill="#202B27" opacity=".14" className="shay-shadow" />
      <defs>
        <radialGradient id="shay-shine" cx="0.32" cy="0.25" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".16" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
