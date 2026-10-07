import React from 'react';
import { GlobeCollection } from '@designcodeio/threeui';
import '@designcodeio/threeui/style.css';

interface EnergyOrbBackgroundProps {
  speed?: number;
  scale?: number;
  smokeScale?: number;
  smokeStrength?: number;
  smokeSpeed?: number;
  hue?: number;
  saturation?: number;
  glow?: number;
  starDensity?: number;
  starSpeed?: number;
  starSize?: number;
  brightness?: number;
  opacity?: number;
  className?: string;
}

export function Scene() {
  return (
    <div className="shader-frame">
      <GlobeCollection
        variant="energy-orb"
        speed={1.00}
        scale={1.00}
        smokeScale={1.00}
        smokeStrength={1.00}
        smokeSpeed={1.00}
        hue={0}
        saturation={1.00}
        glow={1.00}
        starDensity={1.00}
        starSpeed={1.00}
        starSize={1.00}
        brightness={1.00}
        opacity={1.00}
      />
    </div>
  );
}

export const EnergyOrbBackground: React.FC<EnergyOrbBackgroundProps> = ({
  speed = 1.00,
  scale = 1.00,
  smokeScale = 1.00,
  smokeStrength = 1.00,
  smokeSpeed = 1.00,
  hue = 0,
  saturation = 1.00,
  glow = 1.00,
  starDensity = 1.00,
  starSpeed = 1.00,
  starSize = 1.00,
  brightness = 1.00,
  opacity = 1.00,
  className = '',
}) => {
  return (
    <div className={`absolute inset-0 pointer-events-none z-0 overflow-hidden shader-frame ${className}`}>
      <GlobeCollection
        variant="energy-orb"
        speed={speed}
        scale={scale}
        smokeScale={smokeScale}
        smokeStrength={smokeStrength}
        smokeSpeed={smokeSpeed}
        hue={hue}
        saturation={saturation}
        glow={glow}
        starDensity={starDensity}
        starSpeed={starSpeed}
        starSize={starSize}
        brightness={brightness}
        opacity={opacity}
      />
    </div>
  );
};
