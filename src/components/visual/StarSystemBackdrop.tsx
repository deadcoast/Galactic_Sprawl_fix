import { useEffect, useRef } from 'react';

interface StarSystemBackdropProps {
  quality: 'low' | 'medium' | 'high';
  dayNightCycle: number;
}

export function StarSystemBackdrop({ quality, dayNightCycle }: StarSystemBackdropProps) {
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

    // Star layer configuration
    const layers = [
      { count: quality === 'high' ? 100 : quality === 'medium' ? 50 : 25, speed: 0.1, size: 1 },
      { count: quality === 'high' ? 75 : quality === 'medium' ? 35 : 15, speed: 0.2, size: 2 },
      { count: quality === 'high' ? 50 : quality === 'medium' ? 25 : 10, speed: 0.3, size: 3 }
    ];

    // Create stars for each layer
    const stars = layers.flatMap(layer => 
      Array.from({ length: layer.count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: layer.size,
        speed: layer.speed,
        brightness: 0.5 + Math.random() * 0.5
      }))
    );

    // Animation loop
    let animationFrame: number;
    const animate = () => {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + dayNightCycle * 0.2})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw stars
      stars.forEach(star => {
        // Move star
        star.x -= star.speed;
        if (star.x < 0) {
          star.x = canvas.width;
        }

        // Draw star with glow
        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 2
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${star.brightness})`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw nebula effect for higher qualities
      if (quality !== 'low') {
        const nebulaGradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, canvas.width / 2
        );

        nebulaGradient.addColorStop(0, 'rgba(99, 102, 241, 0.05)');
        nebulaGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.03)');
        nebulaGradient.addColorStop(1, 'transparent');

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
  }, [quality, dayNightCycle]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}