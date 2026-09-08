import { useEffect, useRef } from "react";

export default function ScrollDepthBackground() {
  const sceneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const scroll = Math.min(window.scrollY, 2600);
      const scene = sceneRef.current;
      if (!scene) return;
      scene.style.setProperty("--scroll-depth", `${scroll}px`);
      scene.style.setProperty("--scroll-tilt", `${Math.min(scroll / 120, 18)}deg`);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);
  return <div ref={sceneRef} aria-hidden="true" className="depth-scene">
    <div className="depth-plane depth-plane-grid" />
    <div className="depth-plane depth-plane-rings"><span /><span /><span /></div>
    <div className="depth-orb depth-orb-a" />
    <div className="depth-orb depth-orb-b" />
  </div>;
}
