import { useState, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

interface Props {
  mapRef: RefObject<MapRef | null>;
}

const BTN_SIZE = 36;

const baseBtn: React.CSSProperties = {
  width: BTN_SIZE,
  height: BTN_SIZE,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  color: '#F8FAFC',
  cursor: 'pointer',
  borderRadius: 6,
  transition: 'background 150ms ease',
  flexShrink: 0,
};

const groupStyle: React.CSSProperties = {
  background: '#1E293B',
  border: '1px solid #334155',
  borderRadius: 8,
  padding: 4,
  boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 0,
};

function Btn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{ ...baseBtn, background: hovered ? '#334155' : 'transparent' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

// Inline SVG chevrons — no icon library needed
const ChevronUp = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,10 8,5 13,10" />
  </svg>
);
const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,6 8,11 13,6" />
  </svg>
);
const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="10,3 5,8 10,13" />
  </svg>
);
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,3 11,8 6,13" />
  </svg>
);
const Plus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="8" y1="3" x2="8" y2="13" />
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);
const Minus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);

const PAN = 150;

export default function MapControls({ mapRef }: Props) {
  const map = () => mapRef.current;

  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: 16,
      zIndex: 10,
      display: 'flex',
      gap: 8,
      alignItems: 'flex-end',
    }}>
      {/* Pan controls */}
      <div style={groupStyle}>
        <Btn title="Pan up" onClick={() => map()?.panBy([0, -PAN], { duration: 250 })}>
          <ChevronUp />
        </Btn>
        <div style={{ display: 'flex', gap: 0 }}>
          <Btn title="Pan left" onClick={() => map()?.panBy([-PAN, 0], { duration: 250 })}>
            <ChevronLeft />
          </Btn>
          {/* Centre dot */}
          <div style={{ ...baseBtn, cursor: 'default', opacity: 0.3 }}>
            <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="2.5" fill="currentColor"/></svg>
          </div>
          <Btn title="Pan right" onClick={() => map()?.panBy([PAN, 0], { duration: 250 })}>
            <ChevronRight />
          </Btn>
        </div>
        <Btn title="Pan down" onClick={() => map()?.panBy([0, PAN], { duration: 250 })}>
          <ChevronDown />
        </Btn>
      </div>

      {/* Zoom controls */}
      <div style={groupStyle}>
        <Btn title="Zoom in" onClick={() => map()?.zoomIn({ duration: 200 })}>
          <Plus />
        </Btn>
        <div style={{ width: BTN_SIZE, height: 1, background: '#334155', margin: '2px 0' }} />
        <Btn title="Zoom out" onClick={() => map()?.zoomOut({ duration: 200 })}>
          <Minus />
        </Btn>
      </div>
    </div>
  );
}
