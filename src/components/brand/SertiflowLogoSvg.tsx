type LogoProps = { height: number; tagline?: string };

function wordmarkBox(tagline: string) {
  const units = Math.max(268, 64 + Math.ceil(tagline.length * 6.6));
  return { units, nameY: tagline ? 30 : 34 };
}

const mark = (h: number) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    fill="none"
    height={h}
    width={h}
    role="img"
    aria-hidden
  >
    <rect x="4" y="4" width="40" height="40" rx="12" fill="#001A4D" />
    <path
      d="M12 30c6-10 14-12 22-8 4 2 6 0 8-4"
      stroke="#FFCD00"
      strokeWidth="3.2"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M12 22c5-6 12-8 18-5 5 3 8 1 10-3"
      stroke="#ffffff"
      strokeOpacity="0.35"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="34" cy="14" r="3" fill="#FFCD00" />
  </svg>
);

export function SertiflowMark({ height }: { height: number }) {
  return mark(height);
}

export function SertiflowLogoLight({ height, tagline = '' }: LogoProps) {
  const line = tagline.trim();
  const { units, nameY } = wordmarkBox(line);
  const width = (units / 52) * height;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${units} 52`}
      fill="none"
      height={height}
      width={width}
      role="img"
      aria-hidden
    >
      <rect x="2" y="6" width="40" height="40" rx="11" fill="#ffffff" fillOpacity="0.1" />
      <rect
        x="2"
        y="6"
        width="40"
        height="40"
        rx="11"
        stroke="#ffffff"
        strokeOpacity="0.18"
        strokeWidth="1"
      />
      <path
        d="M10 32c5-8 12-10 18-7 3.5 2 5.5 0 7-3"
        stroke="#FFCD00"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M10 24c4-5 10-7 15-4.5 4 2.5 6.5 0.5 8-2.5"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="32" cy="16" r="2.5" fill="#FFCD00" />
      <text
        x="52"
        y={nameY}
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontSize="23"
        fontWeight="600"
        fill="#ffffff"
        letterSpacing="-0.4"
      >
        Sertiflow
      </text>
      {line ? (
        <text
          x="52"
          y="44"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          fontSize="10.5"
          fontWeight="500"
          fill="#FFCD00"
          fillOpacity="0.95"
          letterSpacing="0.15"
        >
          {line}
        </text>
      ) : null}
    </svg>
  );
}

export function SertiflowLogoDark({ height, tagline = '' }: LogoProps) {
  const line = tagline.trim();
  const { units, nameY } = wordmarkBox(line);
  const width = (units / 52) * height;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${units} 52`}
      fill="none"
      height={height}
      width={width}
      role="img"
      aria-hidden
    >
      <rect x="2" y="6" width="40" height="40" rx="11" fill="#001A4D" />
      <path
        d="M10 32c5-8 12-10 18-7 3.5 2 5.5 0 7-3"
        stroke="#FFCD00"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M10 24c4-5 10-7 15-4.5 4 2.5 6.5 0.5 8-2.5"
        stroke="#001A4D"
        strokeOpacity="0.2"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="32" cy="16" r="2.5" fill="#FFCD00" />
      <text
        x="52"
        y={nameY}
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontSize="23"
        fontWeight="700"
        fill="#001A4D"
        letterSpacing="-0.4"
      >
        Sertiflow
      </text>
      {line ? (
        <text
          x="52"
          y="44"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          fontSize="10.5"
          fontWeight="600"
          fill="#5c6b7a"
          letterSpacing="0.2"
        >
          {line}
        </text>
      ) : null}
    </svg>
  );
}
