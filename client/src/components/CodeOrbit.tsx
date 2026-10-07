import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Line, RoundedBox } from "@react-three/drei";

interface OrbitCardData {
  id: string;
  label: string;
  sublabel: string;
  detail: string;
  angle: number;
  radius: number;
  speed: number;
  tilt: number;
}

const ORBIT_CARDS: OrbitCardData[] = [
  { id: "source", label: "SOURCE CODE", sublabel: "2,400+ products", detail: "Production-ready code", angle: 0, radius: 2.8, speed: 0.15, tilt: 0.2 },
  { id: "prompts", label: "AI PROMPTS", sublabel: "Curated collections", detail: "Build smarter", angle: Math.PI * 0.5, radius: 3.2, speed: 0.12, tilt: -0.15 },
  { id: "uikits", label: "UI KITS", sublabel: "Build faster", detail: "Premium components", angle: Math.PI, radius: 2.6, speed: 0.18, tilt: 0.25 },
  { id: "saas", label: "SAAS STARTERS", sublabel: "Ship faster", detail: "Ready to launch", angle: Math.PI * 1.5, radius: 3.0, speed: 0.14, tilt: -0.2 },
  { id: "rating", label: "★ 4.9/5", sublabel: "Developer rated", detail: "Verified reviews", angle: Math.PI * 0.25, radius: 2.4, speed: 0.2, tilt: 0.1 },
  { id: "price", label: "$24", sublabel: "Average starter", detail: "One-time purchase", angle: Math.PI * 1.25, radius: 2.5, speed: 0.16, tilt: -0.1 },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 1024 || /Mobi|Android/i.test(navigator.userAgent));
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

function CodePanelMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const reducedMotion = usePrefersReducedMotion();

  useFrame((state) => {
    if (reducedMotion || !meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.y = Math.sin(t * 0.5) * 0.08;
    meshRef.current.rotation.y = Math.sin(t * 0.3) * 0.05;
  });

  return (
    <Float speed={reducedMotion ? 0 : 1.2} rotationIntensity={reducedMotion ? 0 : 0.3} floatIntensity={reducedMotion ? 0 : 0.4}>
      <RoundedBox ref={meshRef} args={[2.2, 1.5, 0.15]} radius={0.08} smoothness={4} position={[0, 0, 0]}>
        <meshPhysicalMaterial color="#1a2340" metalness={0.6} roughness={0.3} clearcoat={0.8} clearcoatRoughness={0.2} envMapIntensity={0.8} />
      </RoundedBox>
    </Float>
  );
}

function OrbitRing({ radius, tilt, color }: { radius: number; tilt: number; color: string }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push([Math.cos(a) * radius, Math.sin(a) * radius * 0.3 * Math.sin(tilt), Math.sin(a) * radius * Math.cos(tilt) * 0.3]);
    }
    return pts;
  }, [radius, tilt]);
  return <Line points={points} color={color} lineWidth={0.8} transparent opacity={0.25} />;
}

function Particles({ count, mobile }: { count: number; mobile: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const reducedMotion = usePrefersReducedMotion();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (reducedMotion || !pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={mobile ? 0.03 : 0.04} color="#13b8b0" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

function Scene({ mobile, mousePos }: { mobile: boolean; mousePos: React.MutableRefObject<[number, number]> }) {
  const { camera } = useThree();
  const reducedMotion = usePrefersReducedMotion();

  useFrame(() => {
    if (reducedMotion) return;
    const [mx, my] = mousePos.current;
    camera.position.x += (mx * 0.3 - camera.position.x) * 0.05;
    camera.position.y += (-my * 0.2 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 3]} intensity={0.8} color="#eef8fa" />
      <pointLight position={[-3, 2, 2]} intensity={0.5} color="#13b8b0" />
      <pointLight position={[3, -1, 1]} intensity={0.3} color="#c7f76d" />
      <CodePanelMesh />
      <OrbitRing radius={2.8} tilt={0.3} color="#13b8b0" />
      <OrbitRing radius={3.2} tilt={-0.2} color="#c7f76d" />
      <OrbitRing radius={2.5} tilt={0.5} color="#13b8b0" />
      <Particles count={mobile ? 20 : 40} mobile={mobile} />
    </>
  );
}

function OrbitCards({ mobile, reducedMotion, mousePos, hoveredId, onHover, onClick }: { mobile: boolean; reducedMotion: boolean; mousePos: React.MutableRefObject<[number, number]>; hoveredId: string | null; onHover: (id: string | null) => void; onClick: (id: string) => void }) {
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const timeRef = useRef(0);
  const hoverSlowRef = useRef(1);

  useEffect(() => {
    let frame: number;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (reducedMotion) return;
      const targetSlow = hoveredId ? 0.4 : 1;
      hoverSlowRef.current += (targetSlow - hoverSlowRef.current) * 0.08;
      timeRef.current += 0.008 * hoverSlowRef.current;
      const [mx, my] = mousePos.current;
      const t = timeRef.current;
      ORBIT_CARDS.forEach((card) => {
        const el = cardRefs.current.get(card.id);
        if (!el) return;
        const angle = card.angle + t * card.speed * 3;
        const x = Math.cos(angle) * card.radius * 60 + mx * 8;
        const y = Math.sin(angle) * card.radius * 22 - my * 6;
        const z = Math.sin(angle) * card.radius * 15;
        const scale = 0.85 + (z + card.radius * 15) / (card.radius * 30) * 0.3;
        const isHovered = hoveredId === card.id;
        const finalScale = isHovered ? scale * 1.15 : scale;
        el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${finalScale}) rotateY(${card.tilt * 10}deg)`;
        el.style.opacity = String(0.5 + scale * 0.5);
        el.style.zIndex = String(Math.round(z * 10 + 100));
      });
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, hoveredId, mousePos]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ perspective: 800 }}>
      {ORBIT_CARDS.map((card) => (
        <div
          key={card.id}
          ref={(el) => { if (el) cardRefs.current.set(card.id, el); }}
          onMouseEnter={() => onHover(card.id)}
          onMouseLeave={() => onHover(null)}
          onClick={(e) => { e.stopPropagation(); onClick(card.id); }}
          className="absolute left-1/2 top-1/2 pointer-events-auto cursor-pointer select-none"
          style={{
            width: mobile ? 100 : 130,
            padding: mobile ? "8px 10px" : "10px 14px",
            borderRadius: 14,
            background: hoveredId === card.id ? "rgba(26,35,64,0.95)" : "rgba(23,32,57,0.82)",
            border: `1px solid ${hoveredId === card.id ? "rgba(199,247,109,0.5)" : "rgba(19,184,176,0.18)"}`,
            boxShadow: hoveredId === card.id ? "0 8px 32px rgba(199,247,109,0.12), 0 0 20px rgba(19,184,176,0.1)" : "0 4px 20px rgba(0,0,0,0.2)",
            backdropFilter: "blur(6px)",
            transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s",
          }}
        >
          <p style={{ margin: 0, fontSize: mobile ? 8 : 9, fontWeight: 700, letterSpacing: "0.12em", color: "#13b8b0", fontFamily: "'DM Mono', monospace" }}>{card.label}</p>
          <p style={{ margin: "2px 0 0", fontSize: mobile ? 9 : 10, color: "#a0aec0", fontFamily: "'DM Sans', sans-serif" }}>{card.sublabel}</p>
          {hoveredId === card.id && <p style={{ margin: "3px 0 0", fontSize: mobile ? 8 : 9, color: "#c7f76d", fontFamily: "'DM Mono', monospace", animation: "fadeUp 0.25s ease both" }}>{card.detail}</p>}
        </div>
      ))}
    </div>
  );
}

export default function CodeOrbit() {
  const mobile = useIsMobile();
  const reducedMotion = usePrefersReducedMotion();
  const mousePos = useRef<[number, number]>([0, 0]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(
    () => (typeof window === "undefined" ? 900 : window.innerHeight)
  );

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // The auth panel never scrolls, so the scene has to give way on short viewports.
  const sceneHeight = viewportHeight < 700 ? 168 : viewportHeight < 860 ? 200 : mobile ? 200 : 240;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || reducedMotion) return;
    const rect = containerRef.current.getBoundingClientRect();
    mousePos.current = [(e.clientX - rect.left) / rect.width - 0.5, (e.clientY - rect.top) / rect.height - 0.5];
  }, [reducedMotion]);

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} className="relative w-full" style={{ height: sceneHeight }}>
      <Canvas dpr={[1, mobile ? 1 : 1.5]} camera={{ position: [0, 0, 6], fov: 45 }} style={{ position: "absolute", inset: 0 }} gl={{ antialias: !mobile, alpha: true }}>
        <Scene mobile={mobile} mousePos={mousePos} />
      </Canvas>
      {/* Central code panel overlay */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: mobile ? 260 : 320 }}>
        <div style={{ padding: "20px 24px", borderRadius: 14, background: "rgba(23,32,57,0.92)", border: "1px solid rgba(19,184,176,0.25)", boxShadow: "0 0 40px rgba(19,184,176,0.08), inset 0 1px 0 rgba(255,255,255,0.06)", fontFamily: "'DM Mono', monospace" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ color: "#c7f76d", fontSize: 22, fontWeight: 700 }}>{"</>"}</span>
            <span style={{ color: "#eef8fa", fontSize: 14, fontWeight: 600, letterSpacing: "0.05em" }}>DEV MARKET</span>
          </div>
          <pre style={{ margin: 0, fontSize: mobile ? 10 : 11, lineHeight: 1.6, color: "#71809f" }}>{`const project = {
  type: "SaaS",
  stack: "Next.js",
  ready: true
}`}</pre>
        </div>
      </div>
      <OrbitCards mobile={mobile} reducedMotion={reducedMotion} mousePos={mousePos} hoveredId={hoveredId} onHover={setHoveredId} onClick={() => {}} />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#71809f", letterSpacing: "0.14em" }}>
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#527f1e]" style={{ animation: reducedMotion ? "none" : "pulse 2s ease-in-out infinite" }} />
        MARKETPLACE ONLINE
      </div>
    </div>
  );
}
