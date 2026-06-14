interface FuelGaugeLogoProps {
  className?: string;
  size?: number;
}

export function FuelGaugeLogo({ className = "", size = 56 }: FuelGaugeLogoProps) {
  return (
    <svg
      viewBox="0 0 100 60"
      width={size}
      height={size * 0.6}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="FuelFool logo — fuel gauge"
    >
      {/* Outer arc */}
      <path
        d="M 8 52 A 42 42 0 0 1 92 52"
        stroke="#F5A623"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Tick marks — evenly spaced along the arc at 0°,30°,60°,90°,120°,150°,180° from left */}
      {[180, 150, 120, 90, 60, 30, 0].map((angleDeg, i) => {
        const angleRad = (angleDeg * Math.PI) / 180;
        const cx = 50 + 42 * Math.cos(angleRad);
        const cy = 52 - 42 * Math.sin(angleRad);
        const innerR = 34;
        const x1 = 50 + innerR * Math.cos(angleRad);
        const y1 = 52 - innerR * Math.sin(angleRad);
        const isMajor = i === 0 || i === 3 || i === 6;
        return (
          <line
            key={angleDeg}
            x1={x1}
            y1={y1}
            x2={cx}
            y2={cy}
            stroke={isMajor ? "#F5A623" : "#F5A62388"}
            strokeWidth={isMajor ? 2.5 : 1.8}
            strokeLinecap="round"
          />
        );
      })}

      {/* Needle — pointing toward "empty" (lower-left, ~150° from right) */}
      {(() => {
        const needleAngle = (150 * Math.PI) / 180;
        const nx = 50 + 30 * Math.cos(needleAngle);
        const ny = 52 - 30 * Math.sin(needleAngle);
        return (
          <line
            x1="50"
            y1="52"
            x2={nx}
            y2={ny}
            stroke="#F5A623"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        );
      })()}

      {/* Center pivot */}
      <circle cx="50" cy="52" r="3.5" fill="#F5A623" />

      {/* Gas pump icon — lower left area */}
      <g transform="translate(17, 38)" fill="#F5A623">
        {/* Pump body */}
        <rect x="0" y="2" width="7" height="9" rx="1" />
        {/* Pump top */}
        <rect x="1" y="0" width="5" height="2.5" rx="0.5" />
        {/* Nozzle arm */}
        <path d="M 7 3.5 Q 10 3.5 10 6 L 10 9" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Nozzle tip */}
        <rect x="9" y="8" width="2.5" height="1.5" rx="0.5" />
      </g>
    </svg>
  );
}
