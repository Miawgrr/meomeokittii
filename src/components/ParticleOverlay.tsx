import React, { useEffect, useRef } from "react";

interface ParticleOverlayProps {
  isDarkMode?: boolean;
  effect?: string; // "snow" | "cat_paw" | "cherry_blossom" | "heart" | "star" | "bubbles" | "autumn_leaves"
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  maxOpacity: number;
  fadeSpeed: number;
  color: string;
  swaySpeed: number;
  swayOffset: number;
  rotation: number;
  rotationSpeed: number;
  shape: "circle" | "sparkle" | "petal" | "paw" | "heart" | "bubble" | "leaf";
}

export const ParticleOverlay: React.FC<ParticleOverlayProps> = ({ 
  isDarkMode = false,
  effect = "cherry_blossom"
}) => {
  const isLagReduced = typeof window !== "undefined" && localStorage.getItem("meomeo_lag_reduced") === "true";
  if (effect === "none" || isLagReduced) return null;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Dynamic colors based on the selected falling effect
    const getColorsByEffect = () => {
      switch (effect) {
        case "snow":
          // Pristine whites, soft light blues
          return [
            "rgba(255, 255, 255, ",
            "rgba(240, 249, 255, ", // Sky-50
            "rgba(224, 242, 254, ", // Sky-100
            "rgba(253, 244, 245, ", // Soft warm white
            "rgba(255, 255, 255, "
          ];
        case "cat_paw":
          // Cute cat pink, warm caramel, soft cream
          return [
            "rgba(254, 243, 199, ", // Amber-50
            "rgba(255, 182, 193, ", // Light Pink
            "rgba(251, 146, 60, ",  // Orange-400
            "rgba(244, 114, 182, ", // Rose-400
            "rgba(254, 226, 226, "  // Red-100
          ];
        case "heart":
          // Loving candy pinks, sweet ruby reds, hot magentas
          return [
            "rgba(239, 68, 68, ",   // Red-500
            "rgba(244, 114, 182, ", // Rose-400
            "rgba(225, 29, 72, ",   // Rose-600
            "rgba(236, 72, 153, ",  // Pink-500
            "rgba(251, 113, 133, "  // Rose-400
          ];
        case "star":
          // Twinkling yellow stars, gold, bright diamond white
          return [
            "rgba(251, 191, 36, ",  // Amber-400
            "rgba(253, 224, 71, ",  // Yellow-300
            "rgba(245, 158, 11, ",  // Amber-500
            "rgba(255, 255, 255, ", // Pure White
            "rgba(254, 240, 138, "  // Yellow-200
          ];
        case "bubbles":
          // Soap bubble pastel iridescence (very light and transparent)
          return [
            "rgba(147, 197, 253, ", // Blue-300
            "rgba(196, 181, 253, ", // Purple-300
            "rgba(244, 114, 182, ", // Rose-400
            "rgba(110, 231, 183, ", // Emerald-300
            "rgba(167, 243, 208, "  // Emerald-200
          ];
        case "autumn_leaves":
          // Rich copper, warm amber, rustic orange, fiery maple red
          return [
            "rgba(180, 83, 9, ",   // Amber-700
            "rgba(220, 38, 38, ",   // Red-600
            "rgba(217, 119, 6, ",   // Amber-600
            "rgba(249, 115, 22, ",   // Orange-500
            "rgba(234, 88, 12, "    // Orange-600
          ];
        case "cherry_blossom":
        default:
          // Classic beautiful cherry blossoms
          return isDarkMode
            ? [
                "rgba(255, 182, 193, ", // Light Pink
                "rgba(255, 105, 180, ", // Hot Pink
                "rgba(244, 114, 182, ", // Rose Pink
                "rgba(253, 244, 245, ", // Sakura White
                "rgba(224, 73, 114, "   // Deep Blossom
              ]
            : [
                "rgba(251, 113, 133, ",
                "rgba(244, 63, 94, ",
                "rgba(245, 158, 11, ",
                "rgba(244, 114, 182, ",
                "rgba(225, 29, 72, "
              ];
      }
    };

    const colors = getColorsByEffect();
    const particleCount = Math.min(Math.floor((width * height) / 11000), 100);
    const particles: Particle[] = [];

    const createParticle = (initialY?: number): Particle => {
      const colorBase = colors[Math.floor(Math.random() * colors.length)];
      
      let size = Math.random() * 3.5 + 1.5;
      let speedY = Math.random() * 0.9 + 0.45;
      let speedX = (Math.random() - 0.4) * 0.45;
      let maxOpacity = Math.random() * 0.7 + 0.3;
      let shape: "circle" | "sparkle" | "petal" | "paw" | "heart" | "bubble" | "leaf" = "circle";

      // Tailor parameters and shape configurations according to selected effect
      if (effect === "snow") {
        size = Math.random() * 2.3 + 0.9; // Tiny snow particles
        speedY = Math.random() * 0.8 + 0.55;
        speedX = (Math.random() - 0.5) * 0.35;
        maxOpacity = Math.random() * 0.6 + 0.35;
        shape = "circle";
      } else if (effect === "cat_paw") {
        size = Math.random() * 4.5 + 4.5; // Larger for visible paw prints
        speedY = Math.random() * 0.6 + 0.45;
        speedX = (Math.random() - 0.55) * 0.3;
        maxOpacity = Math.random() * 0.5 + 0.35;
        shape = "paw";
      } else if (effect === "heart") {
        size = Math.random() * 3.5 + 3.0; // Sweet heart sizes
        speedY = Math.random() * 0.7 + 0.5;
        speedX = (Math.random() - 0.5) * 0.4;
        maxOpacity = Math.random() * 0.65 + 0.3;
        shape = "heart";
      } else if (effect === "star") {
        size = Math.random() * 3.0 + 2.0;
        speedY = Math.random() * 0.6 + 0.4;
        speedX = (Math.random() - 0.5) * 0.3;
        maxOpacity = Math.random() * 0.8 + 0.2;
        shape = "sparkle";
      } else if (effect === "bubbles") {
        size = Math.random() * 5.0 + 3.0;
        speedY = (Math.random() - 0.7) * 0.6; // Soap bubbles float or slowly descend/ascend
        speedX = (Math.random() - 0.5) * 0.5;
        maxOpacity = Math.random() * 0.35 + 0.15; // Extremely faint transparent bubbles
        shape = "bubble";
      } else if (effect === "autumn_leaves") {
        size = Math.random() * 5.0 + 4.5; // Chunky leaves
        speedY = Math.random() * 0.85 + 0.5;
        speedX = (Math.random() - 0.3) * 0.55; // Windy drift
        maxOpacity = Math.random() * 0.7 + 0.3;
        shape = "leaf";
      } else {
        // Classic Cherry Blossoms (sakura)
        size = Math.random() * 3.5 + 2.0;
        speedY = Math.random() * 0.95 + 0.45;
        speedX = (Math.random() - 0.35) * 0.5;
        maxOpacity = Math.random() * 0.7 + 0.3;
        shape = Math.random() < 0.75 ? "petal" : "circle";
      }

      return {
        x: Math.random() * width,
        y: initialY !== undefined ? initialY : -15 - Math.random() * 25,
        size,
        speedY,
        speedX,
        opacity: Math.random() * maxOpacity,
        maxOpacity,
        fadeSpeed: Math.random() * 0.005 + 0.002,
        color: colorBase,
        swaySpeed: Math.random() * 0.012 + 0.004,
        swayOffset: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.025,
        shape
      };
    };

    // Populate initial particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(Math.random() * height));
    }

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, index) => {
        // Update position
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(time * p.swaySpeed + p.swayOffset) * 0.35;
        p.rotation += p.rotationSpeed;

        // Pulsing opacity fading in and out elegantly
        p.opacity += p.fadeSpeed;
        if (p.opacity >= p.maxOpacity || p.opacity <= 0.1) {
          p.fadeSpeed = -p.fadeSpeed;
        }

        // Special reset boundary checks (if moving off-screen)
        const isOffScreen = 
          p.y > height + 25 || 
          p.y < -35 || // bubbles rising off top
          p.x < -35 || 
          p.x > width + 35;

        if (isOffScreen) {
          // If rising bubbles reset at bottom, else reset at top
          const isBubbleRising = effect === "bubbles" && p.speedY < 0;
          particles[index] = createParticle(isBubbleRising ? height + 15 : undefined);
        }

        ctx.save();
        
        // Final opacity bound checks
        const drawOpacity = Math.max(0.01, Math.min(1, p.opacity));
        ctx.fillStyle = `${p.color}${drawOpacity})`;
        ctx.shadowColor = p.color + "0.45)";
        ctx.shadowBlur = effect === "star" ? p.size * 2 : p.size * 0.8;

        // Draw custom shapes on the fly
        if (p.shape === "sparkle") {
          // Twinkling multi-point star sparkle
          ctx.beginPath();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          const r = p.size * 1.8;
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.28, -r * 0.28);
          ctx.lineTo(r, 0);
          ctx.lineTo(r * 0.28, r * 0.28);
          ctx.lineTo(0, r);
          ctx.lineTo(-r * 0.28, r * 0.28);
          ctx.lineTo(-r, 0);
          ctx.lineTo(-r * 0.28, -r * 0.28);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === "petal") {
          // Beautiful delicate falling organic cherry blossom petal
          ctx.beginPath();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.moveTo(0, -p.size * 1.5);
          ctx.bezierCurveTo(-p.size * 1.8, -p.size * 1.8, -p.size * 1.6, p.size * 1.1, 0, p.size * 2.1);
          ctx.bezierCurveTo(p.size * 1.6, p.size * 1.1, p.size * 1.8, -p.size * 1.8, 0, -p.size * 1.5);
          ctx.fill();
        } else if (p.shape === "paw") {
          // Adorable little kitty cat footprint paws!
          ctx.beginPath();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          const r = p.size;
          // Main large bottom pad (rounded pillow shape)
          ctx.arc(0, r * 0.2, r * 0.72, 0, Math.PI * 2);
          ctx.fill();
          // Top four tiny toe pads in a curved arc
          ctx.beginPath();
          ctx.arc(-r * 0.65, -r * 0.45, r * 0.32, 0, Math.PI * 2);
          ctx.arc(-r * 0.22, -r * 0.85, r * 0.34, 0, Math.PI * 2);
          ctx.arc(r * 0.22, -r * 0.85, r * 0.34, 0, Math.PI * 2);
          ctx.arc(r * 0.65, -r * 0.45, r * 0.32, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "heart") {
          // Sweet romantic little hearts
          ctx.beginPath();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          const hSize = p.size * 1.35;
          ctx.moveTo(0, -hSize * 0.4);
          ctx.bezierCurveTo(-hSize * 0.8, -hSize * 1.0, -hSize * 1.4, -hSize * 0.15, 0, hSize * 0.95);
          ctx.bezierCurveTo(hSize * 1.4, -hSize * 0.15, hSize * 0.8, -hSize * 1.0, 0, -hSize * 0.4);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === "bubble") {
          // Weightless transparent soap bubble with reflection highlight
          ctx.beginPath();
          ctx.translate(p.x, p.y);
          ctx.arc(0, 0, p.size * 1.8, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw glassy white rim
          ctx.strokeStyle = `rgba(255, 255, 255, ${drawOpacity * 0.85})`;
          ctx.lineWidth = 0.85;
          ctx.stroke();

          // Delicate specular white gleam dot inside bubble
          ctx.beginPath();
          ctx.arc(-p.size * 0.55, -p.size * 0.55, p.size * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${drawOpacity * 0.9})`;
          ctx.fill();
        } else if (p.shape === "leaf") {
          // Coppery oak or maple leafy silhouette with stem line
          ctx.beginPath();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.moveTo(0, -p.size * 2);
          ctx.quadraticCurveTo(-p.size * 1.6, -p.size * 0.4, -p.size * 1.9, p.size);
          ctx.quadraticCurveTo(-p.size * 0.5, p.size * 0.5, 0, p.size * 2);
          ctx.quadraticCurveTo(p.size * 0.5, p.size * 0.5, p.size * 1.9, p.size);
          ctx.quadraticCurveTo(p.size * 1.6, -p.size * 0.4, 0, -p.size * 2);
          ctx.fill();

          // Leaf center nerve line
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 2);
          ctx.lineTo(0, p.size * 1.85);
          ctx.strokeStyle = `rgba(255, 255, 255, ${drawOpacity * 0.4})`;
          ctx.lineWidth = 1.0;
          ctx.stroke();
        } else {
          // Standard falling smooth dots (snow/dust/generic)
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode, effect]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999] w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
};
