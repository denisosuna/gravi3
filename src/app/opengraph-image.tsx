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
        background: '#080f1d',
        color: '#f2f4ff',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
        <svg width="100" height="100" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="15" stroke="#a99bff" strokeWidth="2" fill="none" />
          <ellipse
            cx="32"
            cy="32"
            rx="26"
            ry="9"
            transform="rotate(-28 32 32)"
            fill="none"
            stroke="#a99bff"
            strokeWidth="2"
          />
        </svg>
        <span style={{ fontSize: '100px', fontWeight: 700, letterSpacing: '-5px' }}>Gravi3</span>
      </div>
      <p style={{ fontSize: '38px', color: '#b7b4dd', margin: '35px 0 10px' }}>
        Gravity. Experiments. Six extraordinary orbits.
      </p>
      <p style={{ fontSize: '24px', color: '#a0b0cf' }}>
        An interactive observatory · Un observatorio interactivo
      </p>
    </div>,
    size,
  );
}
