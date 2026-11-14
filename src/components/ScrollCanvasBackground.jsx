import { useEffect, useRef, useState, useCallback } from "react";
import "../styles/ScrollCanvasBackground.css";

const TOTAL_FRAMES = 300;

function getFrameUrl(index) {
  const frameNumber = String(index + 1).padStart(3, "0");
  return `/frames/ezgif-frame-${frameNumber}.jpg`;
}

export default function ScrollCanvasBackground() {
  const canvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // References for animation and cache without triggering re-renders
  const imagesRef = useRef(new Array(TOTAL_FRAMES));
  const loadedRef = useRef(new Uint8Array(TOTAL_FRAMES));
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const rafIdRef = useRef(null);
  const lastDrawnFrameRef = useRef(-1);

  // Find the closest loaded frame to avoid any blank flicker
  const getClosestLoadedImage = useCallback((target) => {
    const idx = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(target)));
    if (loadedRef.current[idx] && imagesRef.current[idx]) {
      return { img: imagesRef.current[idx], frame: idx };
    }

    // Search outwards for closest loaded frame
    for (let r = 1; r < TOTAL_FRAMES; r++) {
      const prev = idx - r;
      if (prev >= 0 && loadedRef.current[prev] && imagesRef.current[prev]) {
        return { img: imagesRef.current[prev], frame: prev };
      }
      const next = idx + r;
      if (next < TOTAL_FRAMES && loadedRef.current[next] && imagesRef.current[next]) {
        return { img: imagesRef.current[next], frame: next };
      }
    }
    return null;
  }, []);

  // Draw frame on canvas with aspect-ratio cover math
  const drawFrame = useCallback((frameFloat) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const match = getClosestLoadedImage(frameFloat);
    if (!match) return;

    const { img, frame } = match;
    lastDrawnFrameRef.current = frame;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || 1280;
    const ih = img.naturalHeight || 720;

    // Cover math (object-fit: cover for canvas)
    const hRatio = cw / iw;
    const vRatio = ch / ih;
    const ratio = Math.max(hRatio, vRatio);

    const destW = iw * ratio;
    const destH = ih * ratio;
    const destX = (cw - destW) * 0.5;
    const destY = (ch - destH) * 0.5;

    ctx.drawImage(img, 0, 0, iw, ih, destX, destY, destW, destH);
  }, [getClosestLoadedImage]);

  // Main animation loop with smooth lerp damping
  useEffect(() => {
    const loop = () => {
      const diff = targetFrameRef.current - currentFrameRef.current;

      if (Math.abs(diff) > 0.01) {
        currentFrameRef.current += diff * 0.15;
        const roundedFrame = Math.round(currentFrameRef.current);
        if (roundedFrame !== lastDrawnFrameRef.current) {
          drawFrame(currentFrameRef.current);
        }
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [drawFrame]);

  // Handle window scroll to update target frame
  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const scrollFraction = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      targetFrameRef.current = scrollFraction * (TOTAL_FRAMES - 1);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle resize for crisp rendering
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      drawFrame(currentFrameRef.current);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [drawFrame]);

  // Priority image loading strategy
  useEffect(() => {
    let isMounted = true;

    const loadFrame = (index) => {
      return new Promise((resolve) => {
        if (loadedRef.current[index]) return resolve();

        const img = new Image();
        img.src = getFrameUrl(index);
        img.onload = () => {
          if (!isMounted) return;
          imagesRef.current[index] = img;
          loadedRef.current[index] = 1;

          if (index === 0) {
            setIsReady(true);
            drawFrame(0);
          }
          resolve();
        };
        img.onerror = () => {
          resolve();
        };
      });
    };

    // Phase 1: Load frame 0 immediately for instant display
    loadFrame(0).then(() => {
      if (!isMounted) return;

      // Phase 2: Load initial batch around beginning (frames 1..15)
      const initialPromises = [];
      for (let i = 1; i < 16 && i < TOTAL_FRAMES; i++) {
        initialPromises.push(loadFrame(i));
      }

      Promise.all(initialPromises).then(() => {
        if (!isMounted) return;

        // Phase 3: Background queue loading remaining frames in concurrent chunks
        const remainingIndices = [];
        for (let i = 16; i < TOTAL_FRAMES; i++) {
          remainingIndices.push(i);
        }

        let currentQueuePos = 0;
        const CONCURRENCY = 8;

        const loadNextBatch = () => {
          if (!isMounted || currentQueuePos >= remainingIndices.length) return;

          const batch = remainingIndices.slice(currentQueuePos, currentQueuePos + CONCURRENCY);
          currentQueuePos += CONCURRENCY;

          Promise.all(batch.map(loadFrame)).then(() => {
            if (isMounted && currentQueuePos < remainingIndices.length) {
              setTimeout(loadNextBatch, 10);
            }
          });
        };

        loadNextBatch();
      });
    });

    return () => {
      isMounted = false;
    };
  }, [drawFrame]);

  return (
    <div className="scroll-canvas-container" aria-hidden="true">
      <canvas ref={canvasRef} className={`scroll-canvas ${isReady ? "is-ready" : ""}`} />
      <div className="scroll-canvas-vignette" />
      <div className="scroll-canvas-grid" />
    </div>
  );
}
