/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from 'react';
import { useEffect, useRef } from 'react';

interface BackgroundEffectProps {
  quality: 'low' | 'medium' | 'high';
  intensity: number;
  colorScheme: 'blue' | 'purple' | 'cyan';
}

export function BackgroundEffect({ quality, intensity, colorScheme }: BackgroundEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    const particleCount = quality === 'high' ? 200 : quality === 'medium' ? 100 : 50;
    const particles: Particle[] = [];

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      private canvas: HTMLCanvasElement;
      private ctx: CanvasRenderingContext2D;

      constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0) {
          this.x = this.canvas.width;
        }
        if (this.x > this.canvas.width) {
          this.x = 0;
        }
        if (this.y < 0) {
          this.y = this.canvas.height;
        }
        if (this.y > this.canvas.height) {
          this.y = 0;
        }
      }

      draw() {
        const gradient = this.ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.size
        );

        const color =
          colorScheme === 'blue'
            ? '59, 130, 246'
            : colorScheme === 'purple'
              ? '139, 92, 246'
              : '34, 211, 238';

        gradient.addColorStop(0, `rgba(${color}, ${this.opacity * intensity})`);
        gradient.addColorStop(1, `rgba(${color}, 0)`);

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas, ctx));
    }

    // Animation loop
    let animationFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw nebula effect
      if (quality !== 'low') {
        const nebulaGradient = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          0,
          canvas.width / 2,
          canvas.height / 2,
          canvas.width / 2
        );

        const nebulaColor =
          colorScheme === 'blue'
            ? '29, 78, 216'
            : colorScheme === 'purple'
              ? '109, 40, 217'
              : '8, 145, 178';

        nebulaGradient.addColorStop(0, `rgba(${nebulaColor}, ${0.05 * intensity})`);
        nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = nebulaGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, [quality, intensity, colorScheme]);

  return React.createElement('canvas', {
    ref: canvasRef,
    className: 'pointer-events-none fixed inset-0',
    style: { zIndex: -1 },
  });
}
