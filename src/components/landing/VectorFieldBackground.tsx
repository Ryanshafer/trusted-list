import React, { useEffect, useRef, useState } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
}

interface Pulse {
    p1: Particle;
    p2: Particle;
    progress: number;
}

interface VectorFieldConfig {
    desktopParticleCount: number;
    mobileParticleCount: number;
    mobileMaxWidth: number;
    desktopConnectionDistance: number;
    mobileConnectionDistance: number;
    desktopClumpNeighborDistance: number;
    mobileClumpNeighborDistance: number;
    desktopClumpMinNeighbors: number;
    mobileClumpMinNeighbors: number;
    linkOpacity: number;
    pulseSpeed: number;
    pulseSpawnChance: number;
    pulseMinLinkDistance: number;
    pulseCoreRadius: number;
    pulseGlowRadius: number;
    maxActivePulses: number;
    attractionDistance: number;
    attractionForce: number;
    velocityDamping: number;
    repulsionDistance: number;
    repulsionForce: number;
    nodeMinSize: number;
    nodeMaxSize: number;
    nodeMinAlpha: number;
    nodeAlphaRange: number;
}

interface VectorFieldBackgroundProps {
    showControls?: boolean;
}

const DEFAULT_PARTICLE_RGB = "153, 143, 132";
const CLUSTER_PARTICLE_RGB = "0, 163, 173";
const DEFAULT_LINK_RGB = "153, 143, 132";
const PULSE_RGB = "0, 163, 173";
const CONFIG_SYNC_EVENT = "vector-field-config-sync";
let controlsHostClaimed = false;

const DEFAULT_CONFIG: VectorFieldConfig = {
    desktopParticleCount: 100,
    mobileParticleCount: 50,
    mobileMaxWidth: 767,
    desktopConnectionDistance: 150,
    mobileConnectionDistance: 95,
    desktopClumpNeighborDistance: 88,
    mobileClumpNeighborDistance: 56,
    desktopClumpMinNeighbors: 4,
    mobileClumpMinNeighbors: 4,
    linkOpacity: 0.32,
    pulseSpeed: 4.0,
    pulseSpawnChance: 0.0008,
    pulseMinLinkDistance: 48,
    pulseCoreRadius: 1.0,
    pulseGlowRadius: 4.0,
    maxActivePulses: 16,
    attractionDistance: 300,
    attractionForce: 0.08,
    velocityDamping: 0.97,
    repulsionDistance: 80,
    repulsionForce: 0.002,
    nodeMinSize: 4,
    nodeMaxSize: 12,
    nodeMinAlpha: 0.05,
    nodeAlphaRange: 0.2,
};

let sharedConfig: VectorFieldConfig = { ...DEFAULT_CONFIG };

interface SliderControl {
    key: keyof VectorFieldConfig;
    label: string;
    min: number;
    max: number;
    step: number;
    integer?: boolean;
}

const CONTROLS: SliderControl[] = [
    { key: "desktopParticleCount", label: "Desktop particles", min: 40, max: 240, step: 1, integer: true },
    { key: "mobileParticleCount", label: "Mobile particles", min: 20, max: 140, step: 1, integer: true },
    { key: "mobileMaxWidth", label: "Mobile breakpoint", min: 480, max: 1024, step: 1, integer: true },
    { key: "desktopConnectionDistance", label: "Desktop connection distance", min: 70, max: 240, step: 1, integer: true },
    { key: "mobileConnectionDistance", label: "Mobile connection distance", min: 40, max: 180, step: 1, integer: true },
    { key: "desktopClumpNeighborDistance", label: "Desktop clump distance", min: 30, max: 180, step: 1, integer: true },
    { key: "mobileClumpNeighborDistance", label: "Mobile clump distance", min: 20, max: 120, step: 1, integer: true },
    { key: "desktopClumpMinNeighbors", label: "Desktop clump neighbors", min: 2, max: 12, step: 1, integer: true },
    { key: "mobileClumpMinNeighbors", label: "Mobile clump neighbors", min: 2, max: 10, step: 1, integer: true },
    { key: "linkOpacity", label: "Link opacity", min: 0.05, max: 0.8, step: 0.01 },
    { key: "pulseSpeed", label: "Pulse speed", min: 0.5, max: 8, step: 0.1 },
    { key: "pulseSpawnChance", label: "Pulse spawn chance", min: 0.0002, max: 0.012, step: 0.0002 },
    { key: "pulseMinLinkDistance", label: "Pulse min link distance", min: 10, max: 140, step: 1, integer: true },
    { key: "pulseCoreRadius", label: "Pulse core radius", min: 0.6, max: 4, step: 0.1 },
    { key: "pulseGlowRadius", label: "Pulse glow radius", min: 2, max: 18, step: 0.1 },
    { key: "maxActivePulses", label: "Max active pulses", min: 2, max: 100, step: 1, integer: true },
    { key: "attractionDistance", label: "Mouse attraction distance", min: 40, max: 480, step: 1, integer: true },
    { key: "attractionForce", label: "Mouse attraction force", min: 0, max: 0.25, step: 0.005 },
    { key: "velocityDamping", label: "Velocity damping", min: 0.9, max: 0.995, step: 0.001 },
    { key: "repulsionDistance", label: "Repulsion distance", min: 20, max: 200, step: 1, integer: true },
    { key: "repulsionForce", label: "Repulsion force", min: 0.0002, max: 0.01, step: 0.0001 },
    { key: "nodeMinSize", label: "Node min size", min: 2, max: 14, step: 0.2 },
    { key: "nodeMaxSize", label: "Node max size", min: 3, max: 20, step: 0.2 },
    { key: "nodeMinAlpha", label: "Node min alpha", min: 0.01, max: 0.5, step: 0.01 },
    { key: "nodeAlphaRange", label: "Node alpha range", min: 0.02, max: 0.6, step: 0.01 },
];

const formatValue = (value: number, step: number) => {
    if (step >= 1) return String(Math.round(value));
    if (step >= 0.1) return value.toFixed(1);
    if (step >= 0.01) return value.toFixed(2);
    if (step >= 0.001) return value.toFixed(3);
    return value.toFixed(4);
};

const normalizeConfig = (next: VectorFieldConfig, changedKey: keyof VectorFieldConfig): VectorFieldConfig => {
    const normalized = { ...next };

    if (changedKey === "nodeMinSize" && normalized.nodeMinSize > normalized.nodeMaxSize) {
        normalized.nodeMaxSize = normalized.nodeMinSize;
    }

    if (changedKey === "nodeMaxSize" && normalized.nodeMaxSize < normalized.nodeMinSize) {
        normalized.nodeMinSize = normalized.nodeMaxSize;
    }

    if (normalized.mobileConnectionDistance > normalized.desktopConnectionDistance) {
        normalized.mobileConnectionDistance = normalized.desktopConnectionDistance;
    }

    if (normalized.mobileClumpNeighborDistance > normalized.desktopClumpNeighborDistance) {
        normalized.mobileClumpNeighborDistance = normalized.desktopClumpNeighborDistance;
    }

    return normalized;
};

export const VectorFieldBackground = ({ showControls = false }: VectorFieldBackgroundProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const pulses = useRef<Pulse[]>([]);
    const mouse = useRef({ x: 0, y: 0 });
    const initParticlesRef = useRef<() => void>(() => undefined);

    const [config, setConfig] = useState<VectorFieldConfig>(() => sharedConfig);
    const configRef = useRef<VectorFieldConfig>(config);
    const [isControlsOpen, setIsControlsOpen] = useState(false);
    const isControlsHost = useRef(false);

    useEffect(() => {
        configRef.current = config;
    }, [config]);

    useEffect(() => {
        const handleConfigSync = (event: Event) => {
            const synced = (event as CustomEvent<VectorFieldConfig>).detail;
            setConfig(synced);
            configRef.current = synced;
            initParticlesRef.current();
        };

        window.addEventListener(CONFIG_SYNC_EVENT, handleConfigSync as EventListener);
        return () => window.removeEventListener(CONFIG_SYNC_EVENT, handleConfigSync as EventListener);
    }, []);

    useEffect(() => {
        if (!controlsHostClaimed) {
            controlsHostClaimed = true;
            isControlsHost.current = true;
        }

        return () => {
            if (isControlsHost.current) {
                controlsHostClaimed = false;
                isControlsHost.current = false;
            }
        };
    }, []);

    useEffect(() => {
        if (!isControlsHost.current) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const isTypingTarget =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                Boolean(target?.isContentEditable);

            if (isTypingTarget || event.metaKey || event.ctrlKey || event.altKey) return;
            if (event.key.toLowerCase() !== "f") return;

            event.preventDefault();
            setIsControlsOpen((prev) => !prev);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const updateConfig = (key: keyof VectorFieldConfig, rawValue: number, integer?: boolean) => {
        setConfig((prev) => {
            const value = integer ? Math.round(rawValue) : rawValue;
            const next = normalizeConfig({ ...prev, [key]: value }, key);
            sharedConfig = next;
            configRef.current = next;
            window.dispatchEvent(new CustomEvent(CONFIG_SYNC_EVENT, { detail: next }));
            initParticlesRef.current();
            return next;
        });
    };

    const resetConfig = () => {
        const next = { ...DEFAULT_CONFIG };
        sharedConfig = next;
        configRef.current = next;
        setConfig(next);
        window.dispatchEvent(new CustomEvent(CONFIG_SYNC_EVENT, { detail: next }));
        initParticlesRef.current();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const initParticles = () => {
            const cfg = configRef.current;
            particles.current = [];
            pulses.current = [];

            const rect = canvas.getBoundingClientRect();
            const width = canvas.width = rect.width;
            const height = canvas.height = rect.height;
            const isMobile = window.innerWidth <= cfg.mobileMaxWidth;
            const particleCount = isMobile ? cfg.mobileParticleCount : cfg.desktopParticleCount;

            for (let i = 0; i < particleCount; i++) {
                particles.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * (cfg.nodeMaxSize - cfg.nodeMinSize) + cfg.nodeMinSize,
                    alpha: Math.random() * cfg.nodeAlphaRange + cfg.nodeMinAlpha,
                });
            }
        };

        initParticlesRef.current = initParticles;

        const animate = () => {
            if (!ctx || !canvas) return;

            const cfg = configRef.current;
            const isMobile = window.innerWidth <= cfg.mobileMaxWidth;
            const linkDistance = isMobile ? cfg.mobileConnectionDistance : cfg.desktopConnectionDistance;
            const clumpDistance = isMobile ? cfg.mobileClumpNeighborDistance : cfg.desktopClumpNeighborDistance;
            const clumpNeighbors = isMobile ? cfg.mobileClumpMinNeighbors : cfg.desktopClumpMinNeighbors;

            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            const particleCount = particles.current.length;
            const nearbyCounts = new Array<number>(particleCount).fill(0);
            const crowdedFlags = new Array<boolean>(particleCount).fill(false);

            // Update particle motion first.
            particles.current.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                const dx = mouse.current.x - p.x;
                const dy = mouse.current.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < cfg.attractionDistance) {
                    p.vx += (dx / dist) * cfg.attractionForce;
                    p.vy += (dy / dist) * cfg.attractionForce;
                }

                p.vx *= cfg.velocityDamping;
                p.vy *= cfg.velocityDamping;
            });

            // Count nearby neighbors once so clump state is stable for the whole frame.
            for (let i = 0; i < particleCount; i++) {
                const p = particles.current[i];
                for (let j = i + 1; j < particleCount; j++) {
                    const p2 = particles.current[j];
                    const dx2 = p.x - p2.x;
                    const dy2 = p.y - p2.y;
                    const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                    if (dist2 < clumpDistance) {
                        nearbyCounts[i]++;
                        nearbyCounts[j]++;
                    }
                }
            }

            // Draw particles based on clump state.
            for (let i = 0; i < particleCount; i++) {
                const p = particles.current[i];
                const isCrowdedClump = nearbyCounts[i] >= clumpNeighbors;
                crowdedFlags[i] = isCrowdedClump;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = isCrowdedClump
                    ? `rgba(${CLUSTER_PARTICLE_RGB}, ${Math.min(p.alpha + 0.18, 0.9)})`
                    : `rgba(${DEFAULT_PARTICLE_RGB}, ${Math.min(p.alpha + 0.06, 0.7)})`;
                ctx.fill();
            }

            // Draw links, repulsion, and spawn pulses only between clumped nodes.
            for (let i = 0; i < particleCount; i++) {
                const p = particles.current[i];
                for (let j = i + 1; j < particleCount; j++) {
                    const p2 = particles.current[j];
                    const dx2 = p.x - p2.x;
                    const dy2 = p.y - p2.y;
                    const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

                    if (dist2 < linkDistance) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(${DEFAULT_LINK_RGB}, ${(1 - dist2 / linkDistance) * cfg.linkOpacity})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();

                        if (
                            crowdedFlags[i] &&
                            crowdedFlags[j] &&
                            dist2 > cfg.pulseMinLinkDistance &&
                            pulses.current.length < cfg.maxActivePulses &&
                            Math.random() < cfg.pulseSpawnChance
                        ) {
                            pulses.current.push({ p1: p, p2: p2, progress: 0 });
                        }
                    }

                    if (dist2 < cfg.repulsionDistance) {
                        const angle = Math.atan2(dy2, dx2);
                        const force = (cfg.repulsionDistance - dist2) * cfg.repulsionForce;
                        p.vx += Math.cos(angle) * force;
                        p.vy += Math.sin(angle) * force;
                        p2.vx -= Math.cos(angle) * force;
                        p2.vy -= Math.sin(angle) * force;
                    }
                }
            }

            for (let i = pulses.current.length - 1; i >= 0; i--) {
                const pulse = pulses.current[i];
                pulse.progress += cfg.pulseSpeed;

                const dx = pulse.p2.x - pulse.p1.x;
                const dy = pulse.p2.y - pulse.p1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (pulse.progress >= dist) {
                    pulses.current.splice(i, 1);
                    continue;
                }

                const ratio = pulse.progress / dist;
                const x = pulse.p1.x + dx * ratio;
                const y = pulse.p1.y + dy * ratio;
                const travelAngle = Math.atan2(dy, dx);

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(travelAngle);

                // Draw an oblong glow + core aligned to pulse travel direction.
                ctx.beginPath();
                ctx.ellipse(
                    0,
                    0,
                    cfg.pulseGlowRadius * 2.2,
                    Math.max(cfg.pulseGlowRadius * 0.8, 0.8),
                    0,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = `rgba(${PULSE_RGB}, 0.18)`;
                ctx.fill();

                ctx.beginPath();
                ctx.ellipse(
                    0,
                    0,
                    cfg.pulseCoreRadius * 2.4,
                    Math.max(cfg.pulseCoreRadius * 0.9, 0.6),
                    0,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = `rgba(${PULSE_RGB}, 0.9)`;
                ctx.shadowColor = `rgba(${PULSE_RGB}, 0.6)`;
                ctx.shadowBlur = 14;
                ctx.fill();
                ctx.restore();
            }

            requestAnimationFrame(animate);
        };

        const handleResize = () => initParticles();

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        initParticles();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
                style={{ width: '100%', height: '100%' }}
            />

            {(showControls || (isControlsHost.current && isControlsOpen)) && (
                <div className="absolute right-3 top-3 z-40 pointer-events-auto md:right-5 md:top-5">
                    {showControls && (
                        <button
                            type="button"
                            onClick={() => setIsControlsOpen((prev) => !prev)}
                            className="rounded-full bg-stone-50/90 border border-stone-300 text-slate-700 px-4 h-10 text-xs font-semibold tracking-wide uppercase shadow-md backdrop-blur-sm hover:bg-stone-100/95 transition-colors"
                        >
                            {isControlsOpen ? "Hide controls" : "Tune vector field"}
                        </button>
                    )}

                    {isControlsOpen && (
                        <div className="mt-2 w-[320px] max-h-[70vh] overflow-y-auto rounded-2xl bg-stone-50/95 border border-stone-300 shadow-xl backdrop-blur-md p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-slate-800">Vector Controls</h3>
                                <button
                                    type="button"
                                    onClick={resetConfig}
                                    className="text-xs font-medium text-[#00A3AD] hover:text-[#008A92]"
                                >
                                    Reset defaults
                                </button>
                            </div>

                            <div className="space-y-3">
                                {CONTROLS.map((control) => (
                                    <label key={control.key} className="block">
                                        <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1.5">
                                            <span>{control.label}</span>
                                            <span className="font-mono text-slate-700">
                                                {formatValue(config[control.key], control.step)}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min={control.min}
                                            max={control.max}
                                            step={control.step}
                                            value={config[control.key]}
                                            onChange={(event) =>
                                                updateConfig(control.key, Number(event.target.value), control.integer)
                                            }
                                            className="w-full accent-[#00A3AD]"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};
