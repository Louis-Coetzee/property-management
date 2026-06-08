'use client';

import { useEffect, useState, useCallback } from 'react';
import type { PointerSettings } from '../builder/PointerSettingsModal';

interface CustomCursorProps {
  settings: PointerSettings;
}

interface CursorPosition {
  x: number;
  y: number;
}

interface TrailDot extends CursorPosition {
  id: number;
  opacity: number;
}

export function CustomCursor({ settings }: CustomCursorProps) {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [trail, setTrail] = useState<TrailDot[]>([]);
  const [clickRipples, setClickRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
    setIsVisible(true);

    // Check if hovering over clickable elements
    const target = e.target as HTMLElement;
    const isClickable = target.closest('a, button, [role="button"], input, textarea, select, [onclick]');
    setIsHovering(!!isClickable);

    // Update trail
    if (settings.trailEnabled) {
      setTrail((prev) => {
        const newTrail = [{ id: Date.now(), x: e.clientX, y: e.clientY, opacity: 1 }, ...prev];
        // Limit trail length
        if (newTrail.length > settings.trailLength) {
          newTrail.pop();
        }
        // Fade out trail dots
        return newTrail.map((dot, index) => ({
          ...dot,
          opacity: 1 - index / settings.trailLength,
        }));
      });
    }
  }, [settings.trailEnabled, settings.trailLength]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
    setTrail([]);
  }, []);

  // Handle click
  const handleClick = useCallback((e: MouseEvent) => {
    if (settings.clickEffect) {
      const ripple = { id: Date.now(), x: e.clientX, y: e.clientY };
      setClickRipples((prev) => [...prev, ripple]);

      // Remove ripple after animation
      setTimeout(() => {
        setClickRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 500);
    }
  }, [settings.clickEffect]);

  // Handle mouse down/up
  const handleMouseDown = useCallback(() => setIsClicking(true), []);
  const handleMouseUp = useCallback(() => setIsClicking(false), []);

  // Set up event listeners
  useEffect(() => {
    if (!settings.enabled) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('click', handleClick);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    // Hide default cursor
    document.body.style.cursor = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);

      // Restore default cursor
      document.body.style.cursor = '';
    };
  }, [settings.enabled, handleMouseMove, handleMouseLeave, handleClick, handleMouseDown, handleMouseUp]);

  if (!settings.enabled || !isVisible) return null;

  const cursorSize = settings.size * (isHovering ? settings.hoverScale : 1) * (isClicking ? 0.9 : 1);

  const renderCursorShape = () => {
    switch (settings.type) {
      case 'circle':
        return (
          <div
            className="rounded-full transition-transform duration-150 ease-out"
            style={{
              width: cursorSize,
              height: cursorSize,
              backgroundColor: settings.color,
              border: `2px solid ${settings.borderColor}`,
              boxShadow: isHovering ? `0 0 20px ${settings.color}40` : 'none',
            }}
          />
        );
      case 'dot':
        return (
          <div
            className="rounded-full transition-transform duration-150 ease-out"
            style={{
              width: cursorSize / 2,
              height: cursorSize / 2,
              backgroundColor: settings.color,
              boxShadow: isHovering ? `0 0 15px ${settings.color}60` : 'none',
            }}
          />
        );
      case 'arrow':
        return (
          <svg
            width={cursorSize}
            height={cursorSize}
            viewBox="0 0 24 24"
            fill="none"
            className="transition-transform duration-150 ease-out"
            style={{
              filter: isHovering ? `drop-shadow(0 0 8px ${settings.color}60)` : 'none',
            }}
          >
            <path
              d="M5 3L19 12L12 14L9 21L5 3Z"
              fill={settings.color}
              stroke={settings.borderColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'car':
        return (
          <svg
            width={cursorSize * 1.5}
            height={cursorSize}
            viewBox="0 0 24 16"
            fill="none"
            className="transition-transform duration-150 ease-out"
            style={{
              filter: isHovering ? `drop-shadow(0 0 8px ${settings.color}60)` : 'none',
            }}
          >
            <path
              d="M2 10C2 9 3 8 4 8H5L6.5 5C7 4 8 3.5 9 3.5H15C16 3.5 17 4 17.5 5L19 8H20C21 8 22 9 22 10V12C22 12.5 21.5 13 21 13H20C20 14.1 19.1 15 18 15C16.9 15 16 14.1 16 13H8C8 14.1 7.1 15 6 15C4.9 15 4 14.1 4 13H3C2.5 13 2 12.5 2 12V10Z"
              fill={settings.color}
              stroke={settings.borderColor}
              strokeWidth="1"
            />
            <circle cx="6" cy="11" r="1.5" fill={settings.borderColor} />
            <circle cx="18" cy="11" r="1.5" fill={settings.borderColor} />
          </svg>
        );
      case 'steering':
        return (
          <svg
            width={cursorSize}
            height={cursorSize}
            viewBox="0 0 32 32"
            fill="none"
            className="transition-transform duration-150 ease-out"
            style={{
              filter: isHovering ? `drop-shadow(0 0 8px ${settings.color}60)` : 'none',
            }}
          >
            {/* Outer rim with gradient effect */}
            <circle cx="16" cy="16" r="13" stroke={settings.color} strokeWidth="4" fill="none" />
            <circle cx="16" cy="16" r="11" stroke={settings.borderColor} strokeWidth="1" fill="none" opacity="0.3" />
            {/* Inner rim detail */}
            <circle cx="16" cy="16" r="9" stroke={settings.color} strokeWidth="1.5" fill="none" opacity="0.5" />
            {/* Center hub */}
            <circle cx="16" cy="16" r="4" fill={settings.color} />
            <circle cx="16" cy="16" r="2.5" fill={settings.borderColor} opacity="0.4" />
            {/* Spokes - top */}
            <path d="M16 7 L16 12" stroke={settings.color} strokeWidth="3" strokeLinecap="round" />
            {/* Spokes - bottom left */}
            <path d="M9 22 L12.5 18" stroke={settings.color} strokeWidth="3" strokeLinecap="round" />
            {/* Spokes - bottom right */}
            <path d="M23 22 L19.5 18" stroke={settings.color} strokeWidth="3" strokeLinecap="round" />
            {/* Grip highlights */}
            <path d="M6 10 A10 10 0 0 1 10 6" stroke={settings.borderColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            <path d="M26 10 A10 10 0 0 0 22 6" stroke={settings.borderColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          </svg>
        );
      case 'key':
        return (
          <svg
            width={cursorSize * 1.3}
            height={cursorSize * 0.7}
            viewBox="0 0 40 22"
            fill="none"
            className="transition-transform duration-150 ease-out"
            style={{
              filter: isHovering ? `drop-shadow(0 0 8px ${settings.color}60)` : 'none',
            }}
          >
            {/* Key fob body */}
            <rect x="2" y="4" width="18" height="14" rx="4" fill={settings.color} />
            <rect x="3" y="5" width="16" height="12" rx="3" fill={settings.borderColor} opacity="0.15" />
            {/* Buttons on fob */}
            <circle cx="8" cy="9" r="2" fill={settings.borderColor} opacity="0.8" />
            <circle cx="14" cy="9" r="2" fill={settings.borderColor} opacity="0.8" />
            <rect x="6" y="13" width="10" height="3" rx="1.5" fill={settings.borderColor} opacity="0.6" />
            {/* Key shaft */}
            <rect x="20" y="8" width="14" height="6" rx="1" fill={settings.color} />
            <rect x="20" y="9" width="12" height="4" fill={settings.borderColor} opacity="0.1" />
            {/* Key teeth */}
            <rect x="28" y="14" width="2" height="3" fill={settings.color} />
            <rect x="32" y="14" width="2" height="4" fill={settings.color} />
            <rect x="36" y="14" width="2" height="3" fill={settings.color} />
            {/* Key tip */}
            <rect x="38" y="8" width="2" height="6" rx="1" fill={settings.color} />
            {/* Highlight on fob */}
            <path d="M5 6 Q11 4 17 6" stroke={settings.borderColor} strokeWidth="1" opacity="0.4" fill="none" />
          </svg>
        );
      case 'pin':
        return (
          <svg
            width={cursorSize}
            height={cursorSize * 1.2}
            viewBox="0 0 24 28"
            fill="none"
            className="transition-transform duration-150 ease-out"
            style={{
              filter: isHovering ? `drop-shadow(0 0 8px ${settings.color}60)` : 'none',
            }}
          >
            <path
              d="M12 2C7.58 2 4 5.58 4 10C4 16.5 12 26 12 26C12 26 20 16.5 20 10C20 5.58 16.42 2 12 2Z"
              fill={settings.color}
              stroke={settings.borderColor}
              strokeWidth="1.5"
            />
            <circle
              cx="12"
              cy="10"
              r="3"
              fill={settings.borderColor}
            />
          </svg>
        );
      case 'default':
      default:
        return null;
    }
  };

  return (
    <>
      {/* Trail dots */}
      {settings.trailEnabled && trail.map((dot, index) => (
        <div
          key={dot.id}
          className="fixed pointer-events-none rounded-full"
          style={{
            left: dot.x - (settings.size / 4),
            top: dot.y - (settings.size / 4),
            width: settings.size / 2,
            height: settings.size / 2,
            backgroundColor: settings.trailColor,
            opacity: dot.opacity * 0.5,
            transform: `scale(${0.5 + (dot.opacity * 0.5)})`,
            transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
            zIndex: 9998,
          }}
        />
      ))}

      {/* Main cursor */}
      <div
        className="fixed pointer-events-none"
        style={{
          left: position.x - (
            settings.type === 'dot' ? cursorSize / 4 :
            settings.type === 'car' ? cursorSize * 0.75 :
            settings.type === 'pin' ? cursorSize / 2 :
            settings.type === 'key' ? cursorSize * 0.65 :
            cursorSize / 2
          ),
          top: position.y - (
            settings.type === 'dot' ? cursorSize / 4 :
            settings.type === 'car' ? cursorSize / 2 :
            settings.type === 'pin' ? cursorSize * 0.6 :
            settings.type === 'key' ? cursorSize * 0.35 :
            cursorSize / 2
          ),
          zIndex: 9999,
        }}
      >
        {renderCursorShape()}
      </div>

      {/* Click ripples */}
      {clickRipples.map((ripple) => (
        <div
          key={ripple.id}
          className="fixed pointer-events-none rounded-full animate-ping"
          style={{
            left: ripple.x - settings.size,
            top: ripple.y - settings.size,
            width: settings.size * 2,
            height: settings.size * 2,
            border: `2px solid ${settings.color}`,
            opacity: 0.5,
          }}
        />
      ))}
    </>
  );
}

// Export a simpler wrapper that can be used in the page renderer
export function CustomCursorWrapper({ pointerSettings }: { pointerSettings?: PointerSettings | null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !pointerSettings?.enabled) return null;

  return <CustomCursor settings={pointerSettings} />;
}
