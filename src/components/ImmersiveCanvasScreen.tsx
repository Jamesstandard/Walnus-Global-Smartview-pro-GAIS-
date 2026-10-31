import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Power, Eye, EyeOff, Radio } from 'lucide-react';

interface ImmersiveCanvasScreenProps {
  isActive: boolean;
  onToggleActive: () => void;
  accentColor?: string;
  className?: string;
  showCornerLedControl?: boolean;
}

export function ImmersiveCanvasScreen({
  isActive,
  onToggleActive,
  accentColor = '#6366f1',
  className = '',
  showCornerLedControl = true,
}: ImmersiveCanvasScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  // Handle canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 640);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 480);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes for LiDAR spatial cloud
    const particlesCount = 45;
    const particles = Array.from({ length: particlesCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 2 + 0.5,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      alpha: Math.random() * 0.7 + 0.3,
    }));

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Space Cybernetic Radial Gradient
      const mx = width * mousePosRef.current.x;
      const my = height * mousePosRef.current.y;
      const bgGrad = ctx.createRadialGradient(
        mx,
        my,
        20,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      bgGrad.addColorStop(0.5, 'rgba(10, 15, 30, 0.98)');
      bgGrad.addColorStop(1, 'rgba(2, 6, 23, 1)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. 3D Perspective Grid Plane (Undulating Floor & Ceiling Waves)
      ctx.save();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.lineWidth = 1;

      const horizon = height * 0.55;
      const fov = 300;
      const gridLines = 14;

      // Vanishing lines radiating from horizon center
      const vanishingX = width * 0.5 + (mousePosRef.current.x - 0.5) * 60;
      for (let i = -gridLines; i <= gridLines; i++) {
        const xOffset = i * (width / gridLines);
        ctx.beginPath();
        ctx.moveTo(vanishingX, horizon);
        ctx.lineTo(vanishingX + xOffset * 2.8, height);
        ctx.stroke();
      }

      // Horizontal perspective grid steps
      for (let j = 1; j <= 10; j++) {
        const p = j / 10;
        const y = horizon + Math.pow(p, 2.2) * (height - horizon);
        const wave = Math.sin(frame * 0.03 + j * 0.6) * 3;
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.05 + p * 0.25})`;
        ctx.beginPath();
        ctx.moveTo(0, y + wave);
        ctx.lineTo(width, y + wave);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Radial Holographic Radar / LiDAR Sweep Wave
      ctx.save();
      const sweepAngle = (frame * 0.025) % (Math.PI * 2);
      const radarRadius = Math.min(width, height) * 0.42;

      ctx.beginPath();
      ctx.arc(vanishingX, horizon, radarRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Radar concentric distance rings
      [0.3, 0.6, 0.85].forEach((ratio) => {
        ctx.beginPath();
        ctx.arc(vanishingX, horizon, radarRadius * ratio, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Sweep Beam Gradient
      ctx.beginPath();
      ctx.moveTo(vanishingX, horizon);
      ctx.arc(
        vanishingX,
        horizon,
        radarRadius,
        sweepAngle - 0.35,
        sweepAngle
      );
      ctx.closePath();
      const sweepGrad = ctx.createRadialGradient(
        vanishingX,
        horizon,
        0,
        vanishingX,
        horizon,
        radarRadius
      );
      sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0.22)');
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // 4. LiDAR Point Cloud Particles & Interconnection Meshes
      ctx.save();
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw particle point
        const pulse = Math.sin(frame * 0.05 + idx) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(129, 140, 248, ${p.alpha * pulse})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.z, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby points to form dynamic spatial mesh
        for (let k = idx + 1; k < particles.length; k++) {
          const p2 = particles[k];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 85) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${(1 - dist / 85) * 0.25})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      ctx.restore();

      // 5. Immersive HUD Data & Hologram Crosshair Nodes
      ctx.save();
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.fillText(
        `DEPTH MATRIX: [${(mousePosRef.current.x * 10).toFixed(2)}m, ${(
          mousePosRef.current.y * 10
        ).toFixed(2)}m]`,
        24,
        height - 24
      );
      ctx.fillText(
        `LIDAR FPS: 60 | RECEPTOR: ACTIVE`,
        width - 210,
        height - 24
      );

      // Central Calibration Crosshair
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(vanishingX - 16, horizon);
      ctx.lineTo(vanishingX + 16, horizon);
      ctx.moveTo(vanishingX, horizon - 16);
      ctx.lineTo(vanishingX, horizon + 16);
      ctx.stroke();
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, accentColor]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    mousePosRef.current = { x, y };
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`absolute inset-0 overflow-hidden pointer-events-auto ${className}`}
    >
      {/* Dynamic Animated Immersive Screen Canvas */}
      {isActive ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-100"
        />
      ) : (
        /* Dark Studio Off-State Screen */
        <div className="absolute inset-0 w-full h-full bg-slate-950/90 transition-opacity duration-500" />
      )}

      {/* ========================================================================= */}
      {/* TINY LED SWITCH ON TOP-LEFT CORNER OF THE CANVAS                          */}
      {/* ========================================================================= */}
      {showCornerLedControl && (
        <div className="absolute top-3.5 left-3.5 z-40 flex items-center gap-2">
          <button
            id="canvas-immersive-led-toggle"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive();
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title={
              isActive
                ? 'Immersive Screen: ACTIVE (Green LED) • Click to switch OFF (Turn Red)'
                : 'Immersive Screen: DEACTIVATED (Red LED) • Click to activate (Turn Green)'
            }
            className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg select-none ${
              isActive
                ? 'bg-slate-950/85 hover:bg-slate-900 border-emerald-500/50 hover:border-emerald-400 text-emerald-300 shadow-emerald-950/40'
                : 'bg-slate-950/85 hover:bg-slate-900 border-rose-500/50 hover:border-rose-400 text-rose-300 shadow-rose-950/40'
            }`}
          >
            {/* The Tiny LED Bulb (Green when Active, Red when Off) */}
            <div className="relative flex items-center justify-center w-3 h-3">
              {isActive ? (
                <>
                  {/* Glowing Green Pulsing Waves */}
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                  {/* Tiny Green LED */}
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10b981] border border-emerald-200/80" />
                </>
              ) : (
                <>
                  {/* Tiny Red LED */}
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] border border-rose-200/80" />
                </>
              )}
            </div>

            {/* LED Status Caption */}
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider leading-none">
                {isActive ? (
                  <span className="text-emerald-400">IMMERSIVE ON</span>
                ) : (
                  <span className="text-rose-400">IMMERSIVE OFF</span>
                )}
              </span>
            </div>

            {/* Subtle State Icon Indicator */}
            <div className="text-[10px] text-slate-400 group-hover:text-slate-200 pl-0.5">
              <Power className={`w-3 h-3 ${isActive ? 'text-emerald-400' : 'text-rose-400'}`} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
