import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

interface FluidGlassProps {
  className?: string;
  mode?: 'lens' | 'bar' | 'cube';
  accentColor?: string;
  interactive?: boolean;
}

const GlassGeometry: React.FC<{
  mode: 'lens' | 'bar' | 'cube';
  isDark: boolean;
  accentColor?: string;
  interactive?: boolean;
}> = ({ mode, isDark, accentColor, interactive = true }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 0.8;
      const y = (e.clientY / window.innerHeight - 0.5) * 0.8;
      targetRotation.current = { x: y, y: x };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = THREE.MathUtils.damp(
      meshRef.current.rotation.x,
      targetRotation.current.x + Math.sin(Date.now() * 0.001) * 0.1,
      2.5,
      delta
    );
    meshRef.current.rotation.y = THREE.MathUtils.damp(
      meshRef.current.rotation.y,
      targetRotation.current.y + Math.cos(Date.now() * 0.001) * 0.15,
      2.5,
      delta
    );
  });

  const geometry = useMemo(() => {
    switch (mode) {
      case 'bar':
        return <boxGeometry args={[3.2, 0.9, 0.6]} />;
      case 'cube':
        return <boxGeometry args={[1.8, 1.8, 1.8]} />;
      case 'lens':
      default:
        return <torusGeometry args={[1.5, 0.45, 32, 64]} />;
    }
  }, [mode]);

  const glassColor = useMemo(() => {
    if (accentColor) return accentColor;
    return isDark ? '#818cf8' : '#6366f1';
  }, [accentColor, isDark]);

  return (
    <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.8}>
      <mesh ref={meshRef} position={[0, 0, 0]} scale={1}>
        {geometry}
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={1.2}
          chromaticAberration={0.06}
          anisotropy={0.2}
          distortion={0.3}
          distortionScale={0.3}
          temporalDistortion={0.1}
          iridescence={0.8}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[100, 400]}
          roughness={0.12}
          transmission={0.92}
          ior={1.45}
          color={glassColor}
        />
      </mesh>
    </Float>
  );
};

export const FluidGlass: React.FC<FluidGlassProps> = ({
  className,
  mode = 'lens',
  accentColor,
  interactive = true,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [isClient, setIsClient] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Performance Gating: On Mobile or Reduced Motion, render lightweight CSS ambient liquid glow
  if (!isClient || isMobile || prefersReducedMotion) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          'relative overflow-hidden pointer-events-none select-none flex items-center justify-center',
          className
        )}
      >
        <div
          className={cn(
            'w-48 h-48 sm:w-64 sm:h-64 rounded-full blur-3xl opacity-60 transition-all duration-700',
            isDark
              ? 'bg-gradient-to-tr from-indigo-600/30 via-purple-600/20 to-sky-500/25'
              : 'bg-gradient-to-tr from-indigo-400/25 via-sky-300/20 to-purple-300/20'
          )}
        />
        <div
          className={cn(
            'absolute inset-4 rounded-3xl border border-white/20 dark:border-white/10 backdrop-blur-md',
            isDark ? 'bg-indigo-950/20' : 'bg-indigo-50/30'
          )}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative pointer-events-none select-none overflow-hidden transition-opacity duration-500',
        className
      )}
    >
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={isDark ? 0.7 : 1.1} />
        <directionalLight position={[5, 5, 5]} intensity={isDark ? 1.2 : 1.6} />
        <pointLight position={[-5, -5, -5]} color="#6366f1" intensity={isDark ? 1.5 : 0.8} />
        <GlassGeometry mode={mode} isDark={isDark} accentColor={accentColor} interactive={interactive} />
      </Canvas>
    </div>
  );
};
