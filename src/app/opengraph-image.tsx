import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: '#0f1420',
        color: '#e9edf5',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
        <svg width="100" height="100" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="15" stroke="#8fb8e8" strokeWidth="2" fill="none" />
          <ellipse
            cx="32"
            cy="32"
            rx="26"
            ry="9"
            transform="rotate(-28 32 32)"
            fill="none"
            stroke="#8fb8e8"
            strokeWidth="2"
          />
        </svg>
        <span style={{ fontSize: '100px', fontWeight: 700, letterSpacing: '-5px' }}>Gravi3</span>
      </div>
      <p style={{ fontSize: '38px', color: '#b3cff0', margin: '35px 0 10px' }}>
        Interactive Three-Body Problem &amp; Gravity Explorer
      </p>
      <p style={{ fontSize: '24px', color: '#a7b1c5' }}>
        Six periodic orbits, a live simulator and an AI tutor
      </p>
    </div>,
    size,
  );
}
