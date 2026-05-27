import React, { useEffect, useRef } from "react";
import createGlobe from "cobe";

export const Globe: React.FC<{ className?: string; size?: number }> = ({ className, size = 600 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionStart = useRef<number | null>(null);
  const r = useRef(0);

  useEffect(() => {
    let phi = 0;
    let width = 0;

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: size * 2,
      height: size * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
      ],
      onRender: (state: any) => {
        if (!pointerInteracting.current) {
          phi += 0.005;
        }
        state.phi = phi + r.current;
        state.width = size * 2;
        state.height = size * 2;
      },
    } as any);

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [size]);

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX - pointerInteractionStart.current!;
          canvasRef.current!.style.cursor = "grabbing";
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          canvasRef.current!.style.cursor = "grab";
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          canvasRef.current!.style.cursor = "grab";
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionStart.current = delta;
            r.current = delta / 200;
          }
        }}
        style={{
          width: size,
          height: size,
          maxWidth: "100vw",
          aspectRatio: 1,
          cursor: "grab",
          contain: "layout paint size",
          opacity: 0,
          transition: "opacity 1s ease",
        }}
        onMouseEnter={() => {
          canvasRef.current!.style.opacity = "1";
        }}
        onLoad={() => {
          canvasRef.current!.style.opacity = "1";
        }}
      />
      <style>{`
        canvas {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};
