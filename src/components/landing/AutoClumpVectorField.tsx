import { useEffect, useRef, useState } from "react";

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    boost: number;
    targetBoost: number;
    settledBoost: number;
}

interface Pulse {
    fromId: number;
    toId: number;
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
    imagePersistentGrowth: number;
}

interface SliderControl {
    key: keyof VectorFieldConfig;
    label: string;
    min: number;
    max: number;
    step: number;
    integer?: boolean;
}

interface AutoClumpVectorFieldProps {
    showControls?: boolean;
    activateOnVisible?: boolean;
    pulseDelayMs?: number;
    onPrimarySequenceComplete?: () => void;
}

const DEFAULT_PARTICLE_RGB = "0, 163, 173";
const CLUSTER_PARTICLE_RGB = "0, 163, 173";
const DEFAULT_LINK_RGB = "102, 114, 122";
const PULSE_RGB = "0, 163, 173";

const LARGE_NODE_IMAGE =
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&h=150&auto=format&fit=crop";
const SMALL_NODE_IMAGE =
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&h=150&auto=format&fit=crop";
const LARGE_NODE_BASE_SCALE = 0.8;
const LARGE_NODE_GROWTH_TARGET = 3;
const SMALL_NODE_GROWTH_TARGET = 0.55;

const DEFAULT_CONFIG: VectorFieldConfig = {
    desktopParticleCount: 20,
    mobileParticleCount: 10,
    mobileMaxWidth: 767,
    desktopConnectionDistance: 150,
    mobileConnectionDistance: 95,
    desktopClumpNeighborDistance: 200,
    mobileClumpNeighborDistance: 56,
    desktopClumpMinNeighbors: 20,
    mobileClumpMinNeighbors: 4,
    linkOpacity: 0.6,
    pulseSpeed: 3.2,
    pulseSpawnChance: 0.0008,
    pulseMinLinkDistance: 48,
    pulseCoreRadius: 1.2,
    pulseGlowRadius: 4.8,
    maxActivePulses: 16,
    attractionDistance: 300,
    attractionForce: 0.056,
    velocityDamping: 0.97,
    repulsionDistance: 112,
    repulsionForce: 0.0036,
    nodeMinSize: 15,
    nodeMaxSize: 40,
    nodeMinAlpha: 0.05,
    nodeAlphaRange: 0.2,
    imagePersistentGrowth: 0.5,
};

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
    { key: "attractionDistance", label: "Attraction distance", min: 40, max: 480, step: 1, integer: true },
    { key: "attractionForce", label: "Attraction force", min: 0, max: 0.25, step: 0.005 },
    { key: "velocityDamping", label: "Velocity damping", min: 0.9, max: 0.995, step: 0.001 },
    { key: "repulsionDistance", label: "Repulsion distance", min: 20, max: 200, step: 1, integer: true },
    { key: "repulsionForce", label: "Repulsion force", min: 0.0002, max: 0.01, step: 0.0001 },
    { key: "nodeMinSize", label: "Node min size", min: 2, max: 14, step: 0.2 },
    { key: "nodeMaxSize", label: "Node max size", min: 3, max: 20, step: 0.2 },
    { key: "nodeMinAlpha", label: "Node min alpha", min: 0.01, max: 0.5, step: 0.01 },
    { key: "nodeAlphaRange", label: "Node alpha range", min: 0.02, max: 0.6, step: 0.01 },
    { key: "imagePersistentGrowth", label: "Image persistent growth", min: 0, max: 0.8, step: 0.02 },
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

export const AutoClumpVectorField = ({
    showControls = true,
    activateOnVisible = false,
    pulseDelayMs = 2200,
    onPrimarySequenceComplete,
}: AutoClumpVectorFieldProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const pulsesRef = useRef<Pulse[]>([]);
    const animationRef = useRef<number | null>(null);
    const initParticlesRef = useRef<() => void>(() => undefined);
    const hasEventPulseFiredRef = useRef(false);
    const eventPulseTargetAtRef = useRef(0);
    const pendingSmallBoostRef = useRef<{ nodeId: number | null; fireAt: number }>({
        nodeId: null,
        fireAt: 0,
    });
    const hasPrimarySequenceCompletedRef = useRef(false);
    const roleNodeRef = useRef<{ smallId: number | null; largeId: number | null }>({
        smallId: null,
        largeId: null,
    });
    const imageRef = useRef<{ small: HTMLImageElement | null; large: HTMLImageElement | null }>({
        small: null,
        large: null,
    });
    const onPrimarySequenceCompleteRef = useRef(onPrimarySequenceComplete);

    const [config, setConfig] = useState<VectorFieldConfig>(DEFAULT_CONFIG);
    const configRef = useRef(config);
    const [isControlsOpen, setIsControlsOpen] = useState(false);
    const [isActive, setIsActive] = useState(!activateOnVisible);

    useEffect(() => {
        configRef.current = config;
    }, [config]);

    useEffect(() => {
        onPrimarySequenceCompleteRef.current = onPrimarySequenceComplete;
    }, [onPrimarySequenceComplete]);

    useEffect(() => {
        if (!activateOnVisible) {
            setIsActive(true);
            return;
        }

        const node = canvasRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const isIntersecting = entries.some((entry) => entry.isIntersecting);
                if (isIntersecting) {
                    setIsActive(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.28 }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [activateOnVisible]);

    useEffect(() => {
        const loadImage = (url: string, key: "small" | "large") => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.decoding = "async";
            img.src = url;
            img.onload = () => {
                imageRef.current[key] = img;
            };
        };

        loadImage(SMALL_NODE_IMAGE, "small");
        loadImage(LARGE_NODE_IMAGE, "large");
    }, []);

    useEffect(() => {
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
            configRef.current = next;
            initParticlesRef.current();
            return next;
        });
    };

    const resetConfig = () => {
        const next = { ...DEFAULT_CONFIG };
        setConfig(next);
        configRef.current = next;
        initParticlesRef.current();
    };

    useEffect(() => {
        if (!isActive) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const center = () => ({ x: canvas.width / 2, y: canvas.height / 2 });
        const getParticleById = (id: number | null) =>
            id == null ? undefined : particlesRef.current.find((p) => p.id === id);

        const initializeParticles = () => {
            const cfg = configRef.current;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            particlesRef.current = [];
            pulsesRef.current = [];

            const isMobile = window.innerWidth <= cfg.mobileMaxWidth;
            const particleCount = isMobile ? cfg.mobileParticleCount : cfg.desktopParticleCount;
            const avgNodeSize = (cfg.nodeMinSize + cfg.nodeMaxSize) / 2;
            const baseRadius = Math.min(canvas.width, canvas.height) * (isMobile ? 0.16 : 0.2);
            const sizeBasedExpansion = Math.max(0, avgNodeSize - 10) * 1.9;
            const clusterRadius = Math.min(
                Math.min(canvas.width, canvas.height) * 0.3,
                baseRadius + sizeBasedExpansion
            );
            const clusterCenter = center();
            const clumpCount = Math.round(particleCount * 0.72);

            for (let i = 0; i < particleCount; i++) {
                const inClump = i < clumpCount;
                const theta = Math.random() * Math.PI * 2;
                const radius = Math.pow(Math.random(), 0.65) * clusterRadius;
                const x = inClump
                    ? clusterCenter.x + Math.cos(theta) * radius
                    : Math.random() * canvas.width;
                const y = inClump
                    ? clusterCenter.y + Math.sin(theta) * radius
                    : Math.random() * canvas.height;

                particlesRef.current.push({
                    id: i,
                    x,
                    y,
                    vx: (Math.random() - 0.5) * 0.42,
                    vy: (Math.random() - 0.5) * 0.42,
                    size: Math.random() * (cfg.nodeMaxSize - cfg.nodeMinSize) + cfg.nodeMinSize,
                    alpha: Math.random() * cfg.nodeAlphaRange + cfg.nodeMinAlpha,
                    boost: 0,
                    targetBoost: 0,
                    settledBoost: 0,
                });
            }

            const clustered = particlesRef.current
                .filter((p) => {
                    const dx = p.x - clusterCenter.x;
                    const dy = p.y - clusterCenter.y;
                    return Math.sqrt(dx * dx + dy * dy) < clusterRadius * 1.08;
                })
                .sort((a, b) => a.size - b.size);

            const centeredCandidates = [...clustered]
                .sort((a, b) => {
                    const da = Math.hypot(a.x - clusterCenter.x, a.y - clusterCenter.y);
                    const db = Math.hypot(b.x - clusterCenter.x, b.y - clusterCenter.y);
                    return da - db;
                })
                .slice(0, Math.max(3, Math.floor(clustered.length * 0.35)));

            const smallNode = [...centeredCandidates].sort((a, b) => a.size - b.size)[0] ?? null;

            const minImageNodeSeparation =
                Math.max(avgNodeSize * 2.8, clusterRadius * 0.42);
            const largeCandidates = [...clustered].sort((a, b) => b.size - a.size);
            const largeNode =
                largeCandidates.find((p) => {
                    if (!smallNode || p.id === smallNode.id) return false;
                    const dx = p.x - smallNode.x;
                    const dy = p.y - smallNode.y;
                    return Math.sqrt(dx * dx + dy * dy) >= minImageNodeSeparation;
                }) ??
                largeCandidates
                    .filter((p) => !smallNode || p.id !== smallNode.id)
                    .sort((a, b) => {
                        if (!smallNode) return 0;
                        const da = Math.hypot(a.x - smallNode.x, a.y - smallNode.y);
                        const db = Math.hypot(b.x - smallNode.x, b.y - smallNode.y);
                        return db - da;
                    })[0] ??
                null;

            if (smallNode) {
                smallNode.size *= 1.2;
            }

            roleNodeRef.current.smallId = smallNode?.id ?? null;
            roleNodeRef.current.largeId = largeNode?.id ?? null;

            hasEventPulseFiredRef.current = false;
            eventPulseTargetAtRef.current = performance.now() + pulseDelayMs;
            pendingSmallBoostRef.current = { nodeId: null, fireAt: 0 };
            hasPrimarySequenceCompletedRef.current = false;
        };

        initParticlesRef.current = initializeParticles;

        const drawImageNode = (p: Particle, image: HTMLImageElement, baseScale = 1) => {
            const drawRadius = p.size * baseScale * (1 + p.boost);
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, drawRadius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(
                image,
                p.x - drawRadius,
                p.y - drawRadius,
                drawRadius * 2,
                drawRadius * 2
            );
            ctx.restore();
        };

        const animate = () => {
            const cfg = configRef.current;
            const isMobile = window.innerWidth <= cfg.mobileMaxWidth;
            const linkDistance = isMobile ? cfg.mobileConnectionDistance : cfg.desktopConnectionDistance;
            const clumpDistance = isMobile
                ? cfg.mobileClumpNeighborDistance
                : cfg.desktopClumpNeighborDistance;
            const clumpNeighbors = isMobile ? cfg.mobileClumpMinNeighbors : cfg.desktopClumpMinNeighbors;
            const clusterCenter = center();
            const avgNodeSize = (cfg.nodeMinSize + cfg.nodeMaxSize) / 2;
            const centerPullScale = Math.max(0.14, 0.34 - avgNodeSize * 0.0035);
            const smallId = roleNodeRef.current.smallId;
            const largeId = roleNodeRef.current.largeId;
            const getParticleVisualRadius = (particle: Particle) => {
                const baseScale = particle.id === largeId ? LARGE_NODE_BASE_SCALE : 1;
                return particle.size * baseScale * (1 + particle.boost);
            };

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const nearbyCounts = new Array<number>(particlesRef.current.length).fill(0);
            const crowdedFlags = new Array<boolean>(particlesRef.current.length).fill(false);

            particlesRef.current.forEach((p) => {
                const dxCenter = clusterCenter.x - p.x;
                const dyCenter = clusterCenter.y - p.y;
                const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter) || 1;
                const tangentX = -dyCenter / distCenter;
                const tangentY = dxCenter / distCenter;

                p.vx += (dxCenter / distCenter) * (cfg.attractionForce * centerPullScale);
                p.vy += (dyCenter / distCenter) * (cfg.attractionForce * centerPullScale);
                p.vx += tangentX * 0.0022;
                p.vy += tangentY * 0.0022;
                p.vx += (Math.random() - 0.5) * 0.013;
                p.vy += (Math.random() - 0.5) * 0.013;

                p.vx *= cfg.velocityDamping;
                p.vy *= cfg.velocityDamping;
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                if (p.targetBoost > p.settledBoost) {
                    p.targetBoost = Math.max(p.settledBoost, p.targetBoost * 0.93);
                } else if (p.targetBoost < p.settledBoost) {
                    p.targetBoost += (p.settledBoost - p.targetBoost) * 0.14;
                }
                p.boost += (p.targetBoost - p.boost) * 0.14;
            });

            for (let i = 0; i < particlesRef.current.length; i++) {
                const p1 = particlesRef.current[i];
                for (let j = i + 1; j < particlesRef.current.length; j++) {
                    const p2 = particlesRef.current[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < clumpDistance) {
                        nearbyCounts[i]++;
                        nearbyCounts[j]++;
                    }

                    const isImagePair =
                        (p1.id === smallId && p2.id === largeId) ||
                        (p1.id === largeId && p2.id === smallId);
                    const dynamicRepulsionDistance = Math.max(
                        cfg.repulsionDistance,
                        (p1.size + p2.size) * 1.35
                    );
                    const minImagePairDistance = isImagePair
                        ? getParticleVisualRadius(p1) + getParticleVisualRadius(p2) + Math.max(14, avgNodeSize * 0.7)
                        : 0;
                    const targetRepulsionDistance = Math.max(dynamicRepulsionDistance, minImagePairDistance);

                    if (dist < targetRepulsionDistance) {
                        const angle = Math.atan2(dy, dx);
                        const force =
                            (targetRepulsionDistance - dist) * cfg.repulsionForce * 1.4;
                        p1.vx += Math.cos(angle) * force;
                        p1.vy += Math.sin(angle) * force;
                        p2.vx -= Math.cos(angle) * force;
                        p2.vy -= Math.sin(angle) * force;
                    }
                }
            }

            const smallNode = getParticleById(smallId);
            const largeNode = getParticleById(largeId);
            if (smallNode && largeNode) {
                let dx = largeNode.x - smallNode.x;
                let dy = largeNode.y - smallNode.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 0.001) {
                    const fallbackAngle = (performance.now() * 0.001) % (Math.PI * 2);
                    dx = Math.cos(fallbackAngle);
                    dy = Math.sin(fallbackAngle);
                    dist = 1;
                }

                const minImageNodeSeparation =
                    getParticleVisualRadius(smallNode) +
                    getParticleVisualRadius(largeNode) +
                    Math.max(14, avgNodeSize * 0.7);
                if (dist < minImageNodeSeparation) {
                    const overlap = minImageNodeSeparation - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const push = overlap * 0.5;
                    smallNode.x -= nx * push;
                    smallNode.y -= ny * push;
                    largeNode.x += nx * push;
                    largeNode.y += ny * push;

                    const separationImpulse = overlap * 0.025;
                    smallNode.vx -= nx * separationImpulse;
                    smallNode.vy -= ny * separationImpulse;
                    largeNode.vx += nx * separationImpulse;
                    largeNode.vy += ny * separationImpulse;
                }
            }

            const maxNeighborCount = Math.max(0, ...nearbyCounts);
            const adaptiveNeighbors =
                maxNeighborCount >= clumpNeighbors
                    ? clumpNeighbors
                    : Math.max(2, Math.floor(maxNeighborCount * 0.7));

            for (let i = 0; i < particlesRef.current.length; i++) {
                crowdedFlags[i] = nearbyCounts[i] >= adaptiveNeighbors;
            }

            for (let i = 0; i < particlesRef.current.length; i++) {
                const p1 = particlesRef.current[i];
                for (let j = i + 1; j < particlesRef.current.length; j++) {
                    const p2 = particlesRef.current[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const isImagePair =
                        (p1.id === roleNodeRef.current.smallId && p2.id === roleNodeRef.current.largeId) ||
                        (p1.id === roleNodeRef.current.largeId && p2.id === roleNodeRef.current.smallId);
                    const shouldDrawLink =
                        dist < linkDistance || isImagePair;
                    if (!shouldDrawLink) continue;

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    if (isImagePair) {
                        ctx.strokeStyle = `rgba(${DEFAULT_LINK_RGB}, 0.62)`;
                        ctx.lineWidth = 1;
                    } else {
                        ctx.strokeStyle = `rgba(${DEFAULT_LINK_RGB}, ${(1 - dist / linkDistance) * cfg.linkOpacity})`;
                        ctx.lineWidth = 1;
                    }
                    ctx.stroke();
                }
            }

            if (!hasEventPulseFiredRef.current && performance.now() >= eventPulseTargetAtRef.current) {
                const small = getParticleById(roleNodeRef.current.smallId);
                const large = getParticleById(roleNodeRef.current.largeId);
                if (small && large && pulsesRef.current.length < cfg.maxActivePulses) {
                    const dx = large.x - small.x;
                    const dy = large.y - small.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist >= cfg.pulseMinLinkDistance) {
                        pulsesRef.current.push({ fromId: small.id, toId: large.id, progress: 0 });
                        hasEventPulseFiredRef.current = true;
                    }
                }
            }

            for (let i = pulsesRef.current.length - 1; i >= 0; i--) {
                const pulse = pulsesRef.current[i];
                const from = getParticleById(pulse.fromId);
                const to = getParticleById(pulse.toId);
                if (!from || !to) {
                    pulsesRef.current.splice(i, 1);
                    continue;
                }

                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                pulse.progress += cfg.pulseSpeed;

                if (pulse.progress >= dist) {
                    // Stagger growth: large node pops first, then small node follows.
                    to.settledBoost = Math.max(to.settledBoost, cfg.imagePersistentGrowth);
                    to.targetBoost = Math.max(to.targetBoost, LARGE_NODE_GROWTH_TARGET);
                    pendingSmallBoostRef.current = {
                        nodeId: from.id,
                        fireAt: performance.now() + 800,
                    };
                    pulsesRef.current.splice(i, 1);
                    continue;
                }

                const ratio = pulse.progress / dist;
                const x = from.x + dx * ratio;
                const y = from.y + dy * ratio;
                const angle = Math.atan2(dy, dx);

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);

                ctx.beginPath();
                ctx.ellipse(
                    0,
                    0,
                    cfg.pulseGlowRadius * 2.4,
                    Math.max(cfg.pulseGlowRadius * 0.85, 0.9),
                    0,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = `rgba(${PULSE_RGB}, 0.2)`;
                ctx.fill();

                ctx.beginPath();
                ctx.ellipse(
                    0,
                    0,
                    cfg.pulseCoreRadius * 2.6,
                    Math.max(cfg.pulseCoreRadius, 0.7),
                    0,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = `rgba(${PULSE_RGB}, 0.94)`;
                ctx.shadowColor = `rgba(${PULSE_RGB}, 0.7)`;
                ctx.shadowBlur = 16;
                ctx.fill();
                ctx.restore();
            }

            if (
                pendingSmallBoostRef.current.nodeId != null &&
                performance.now() >= pendingSmallBoostRef.current.fireAt
            ) {
                const queuedSmall = getParticleById(pendingSmallBoostRef.current.nodeId);
                if (queuedSmall) {
                    queuedSmall.settledBoost = Math.max(
                        queuedSmall.settledBoost,
                        cfg.imagePersistentGrowth
                    );
                    queuedSmall.targetBoost = Math.max(
                        queuedSmall.targetBoost,
                        SMALL_NODE_GROWTH_TARGET
                    );
                    if (!hasPrimarySequenceCompletedRef.current) {
                        hasPrimarySequenceCompletedRef.current = true;
                        onPrimarySequenceCompleteRef.current?.();
                    }
                }
                pendingSmallBoostRef.current = { nodeId: null, fireAt: 0 };
            }

            particlesRef.current.forEach((p, index) => {
                const isSmall = p.id === roleNodeRef.current.smallId;
                const isLarge = p.id === roleNodeRef.current.largeId;

                if (isSmall && imageRef.current.small) {
                    drawImageNode(p, imageRef.current.small);
                    return;
                }
                if (isLarge && imageRef.current.large) {
                    drawImageNode(p, imageRef.current.large, LARGE_NODE_BASE_SCALE);
                    return;
                }

                const baseScale = isLarge ? LARGE_NODE_BASE_SCALE : 1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * baseScale * (1 + p.boost), 0, Math.PI * 2);
                ctx.fillStyle = crowdedFlags[index]
                    ? `rgba(${CLUSTER_PARTICLE_RGB}, ${Math.min(p.alpha + 0.2, 0.92)})`
                    : `rgba(${DEFAULT_PARTICLE_RGB}, ${Math.min(p.alpha + 0.08, 0.7)})`;
                ctx.fill();
            });

            animationRef.current = window.requestAnimationFrame(animate);
        };

        const handleResize = () => initializeParticles();
        window.addEventListener("resize", handleResize);

        initializeParticles();
        animate();

        return () => {
            window.removeEventListener("resize", handleResize);
            if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
        };
    }, [isActive, pulseDelayMs]);

    const shouldRenderControls = isControlsOpen;

    return (
        <>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full"
                style={{ width: "100%", height: "100%" }}
            />

            {shouldRenderControls && (
                <div className="absolute right-3 top-3 z-40 pointer-events-auto md:right-5 md:top-5">
                    <div className="w-[320px] max-h-[70vh] overflow-y-auto rounded-2xl border border-stone-300 bg-stone-50/95 p-4 shadow-xl backdrop-blur-md">
                        <div className="mb-3 flex items-center justify-between">
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
                                    <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-600">
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
                </div>
            )}
        </>
    );
};
