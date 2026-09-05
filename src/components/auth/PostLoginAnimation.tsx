import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

interface PostLoginAnimationProps {
  userName: string;
  userRole: string;
  onComplete: () => void;
}

export const PostLoginAnimation: React.FC<PostLoginAnimationProps> = ({ userName, userRole, onComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // 3 seconds progress bar animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / 12); // 12 ticks = 1200ms
      });
    }, 100);

    const timer = setTimeout(() => {
      onComplete();
    }, 1200);

    return () => {
      clearTimeout(timer);
    };
  }, [onComplete]);

  // Multi-Color Smoke Particles Canvas Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Smoke Particle Definition
    class SmokeParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      maxAlpha: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 2.5;
        this.vy = (Math.random() - 0.5) * 2.5;
        this.radius = Math.random() * 220 + 140;

        const colors = [
          'rgba(59, 130, 246, ',   // Sapphire Blue
          'rgba(16, 185, 129, ',   // Emerald Green
          'rgba(139, 92, 246, ',   // Violet Purple
          'rgba(236, 72, 153, ',   // Neon Pink
          'rgba(6, 182, 212, '     // Cyan
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.maxAlpha = Math.random() * 0.45 + 0.2;
        this.alpha = 0.05;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -this.radius) this.x = width + this.radius;
        if (this.x > width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = height + this.radius;
        if (this.y > height + this.radius) this.y = -this.radius;
      }

      draw(context: CanvasRenderingContext2D) {
        const gradient = context.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius
        );
        gradient.addColorStop(0, `${this.color}${this.maxAlpha})`);
        gradient.addColorStop(0.5, `${this.color}${this.maxAlpha * 0.5})`);
        gradient.addColorStop(1, `${this.color}0)`);

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
      }
    }

    const particles: SmokeParticle[] = Array.from({ length: 30 }, () => new SmokeParticle());

    const render = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // Motion blur trail
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between pointer-events-none overflow-hidden animate-fade-in">
      {/* Interactive Multi-Color Smoke Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

      {/* Swirling CSS Multi-Color Aurora Clouds */}
      <div className="absolute inset-0 opacity-70">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-full blur-3xl animate-pulse mix-blend-screen transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-emerald-500 via-teal-600 to-purple-600 rounded-full blur-3xl animate-pulse mix-blend-screen transform translate-x-1/2 translate-y-1/2 duration-1000" />
        <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-gradient-to-r from-pink-500 via-purple-600 to-amber-500 rounded-full blur-3xl animate-pulse mix-blend-screen transform -translate-y-1/2" />
      </div>
    </div>
  );
};
