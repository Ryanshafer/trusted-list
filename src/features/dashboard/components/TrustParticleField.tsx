"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TrustParticleFieldProps {
    tierIndex: number;
    avatarUrl: string;
    className?: string;
    circular?: boolean;
    /** Fraction of canvas min-dimension used for physics/sizing (default 1).
     *  Use < 1 to keep avatar/particle sizes fixed when the canvas is larger than the content area. */
    contentScale?: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    targetRadius: number;
    alpha: number;
    targetAlpha: number;
    removing: boolean;
}

interface Pulse {
    fromIndex: number;
    toIndex: number;
    progress: number;
}

interface TierConfig {
    count: number;
    minRadius: number;
    maxRadius: number;
    avatarFraction: number;
    orbitPadding: number;
    attractionForce: number;
    repulsionForce: number;
    repulsionDistance: number;
    orbitalDrift: number;
    damping: number;
    linkDistance: number;
    linkOpacity: number;
    pulseSpawnChance: number;
    maxPulses: number;
    pulseSpeed: number;
    pulseCoreRadius: number;
    pulseGlowRadius: number;
}

const TIER_CONFIGS: TierConfig[] = [
    {
        count: 5,
        minRadius: 18, maxRadius: 26,
        avatarFraction: 0.145, orbitPadding: 48,
        attractionForce: 0.022, repulsionForce: 0.003, repulsionDistance: 126,
        orbitalDrift: 0.0014, damping: 0.96,
        linkDistance: 200, linkOpacity: 0.35,
        pulseSpawnChance: 0.0012, maxPulses: 5, pulseSpeed: 2.5,
        pulseCoreRadius: 1.5, pulseGlowRadius: 5,
    },
    {
        count: 9,
        minRadius: 13, maxRadius: 20,
        avatarFraction: 0.176, orbitPadding: 38,
        attractionForce: 0.028, repulsionForce: 0.0033, repulsionDistance: 106,
        orbitalDrift: 0.0018, damping: 0.965,
        linkDistance: 175, linkOpacity: 0.40,
        pulseSpawnChance: 0.0020, maxPulses: 8, pulseSpeed: 2.8,
        pulseCoreRadius: 1.4, pulseGlowRadius: 4.5,
    },
    {
        count: 15,
        minRadius: 9, maxRadius: 15,
        avatarFraction: 0.208, orbitPadding: 28,
        attractionForce: 0.036, repulsionForce: 0.0036, repulsionDistance: 87,
        orbitalDrift: 0.0022, damping: 0.968,
        linkDistance: 155, linkOpacity: 0.45,
        pulseSpawnChance: 0.0032, maxPulses: 14, pulseSpeed: 3.0,
        pulseCoreRadius: 1.3, pulseGlowRadius: 4.0,
    },
    {
        count: 22,
        minRadius: 6, maxRadius: 11,
        avatarFraction: 0.256, orbitPadding: 22,
        attractionForce: 0.044, repulsionForce: 0.0038, repulsionDistance: 70,
        orbitalDrift: 0.0026, damping: 0.970,
        linkDistance: 140, linkOpacity: 0.50,
        pulseSpawnChance: 0.0050, maxPulses: 22, pulseSpeed: 3.2,
        pulseCoreRadius: 1.2, pulseGlowRadius: 3.5,
    },
    {
        count: 35,
        minRadius: 4, maxRadius: 8,
        avatarFraction: 0.320, orbitPadding: 16,
        attractionForce: 0.050, repulsionForce: 0.0036, repulsionDistance: 56,
        orbitalDrift: 0.0030, damping: 0.972,
        linkDistance: 120, linkOpacity: 0.55,
        pulseSpawnChance: 0.0080, maxPulses: 36, pulseSpeed: 3.5,
        pulseCoreRadius: 1.1, pulseGlowRadius: 3.0,
    },
];

const PARTICLE_RGB = "0, 135, 142";
const LINK_RGB = "0, 135, 142";
const AVATAR_BORDER_WIDTH = 3;
const LERP_RATE_AVATAR = 0.025;
const LERP_RATE_PARTICLE = 0.055;
const LERP_RATE_CONFIG = 0.04;

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function lerpConfig(current: TierConfig, target: TierConfig, t: number): TierConfig {
    return {
        count: target.count,
        minRadius: lerp(current.minRadius, target.minRadius, t),
        maxRadius: lerp(current.maxRadius, target.maxRadius, t),
        avatarFraction: lerp(current.avatarFraction, target.avatarFraction, t),
        orbitPadding: lerp(current.orbitPadding, target.orbitPadding, t),
        attractionForce: lerp(current.attractionForce, target.attractionForce, t),
        repulsionForce: lerp(current.repulsionForce, target.repulsionForce, t),
        repulsionDistance: lerp(current.repulsionDistance, target.repulsionDistance, t),
        orbitalDrift: lerp(current.orbitalDrift, target.orbitalDrift, t),
        damping: lerp(current.damping, target.damping, t),
        linkDistance: lerp(current.linkDistance, target.linkDistance, t),
        linkOpacity: lerp(current.linkOpacity, target.linkOpacity, t),
        pulseSpawnChance: lerp(current.pulseSpawnChance, target.pulseSpawnChance, t),
        maxPulses: target.maxPulses,
        pulseSpeed: lerp(current.pulseSpeed, target.pulseSpeed, t),
        pulseCoreRadius: lerp(current.pulseCoreRadius, target.pulseCoreRadius, t),
        pulseGlowRadius: lerp(current.pulseGlowRadius, target.pulseGlowRadius, t),
    };
}

export const TrustParticleField = ({ tierIndex, avatarUrl, className, circular = false, contentScale = 1 }: TrustParticleFieldProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const pulsesRef = useRef<Pulse[]>([]);
    const animationRef = useRef<number | null>(null);

    // Smooth-lerped config — physics and visual params interpolate between tiers
    const currentCfgRef = useRef<TierConfig>({ ...TIER_CONFIGS[0] });
    const targetCfgRef = useRef<TierConfig>({ ...TIER_CONFIGS[0] });

    // Current avatar fraction (lerps separately at a slower rate for drama)
    const avatarFractionRef = useRef(TIER_CONFIGS[0].avatarFraction);

    // Functions exposed to the tier-change effect
    const initParticlesRef = useRef<() => void>(() => undefined);
    const transitionTierRef = useRef<(newTierIndex: number) => void>(() => undefined);

    // Image loading — no crossOrigin so it loads from any domain; canvas taint is fine (draw-only)
    useEffect(() => {
        const img = new Image();
        imageRef.current = img;
        img.src = avatarUrl;
        return () => { imageRef.current = null; };
    }, [avatarUrl]);

    // Respond to tier prop changes with smooth transition
    useEffect(() => {
        targetCfgRef.current = { ...TIER_CONFIGS[Math.min(Math.max(tierIndex, 0), TIER_CONFIGS.length - 1)] };
        transitionTierRef.current(tierIndex);
    }, [tierIndex]);

    // Resize
    useEffect(() => {
        const handleResize = () => initParticlesRef.current();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Main animation loop — runs for component lifetime
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const getDimensions = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            const effectiveSize = Math.min(w, h) * contentScale;
            return { w, h, dpr, effectiveSize };
        };

        const spawnParticle = (
            cx: number, cy: number,
            avatarRadius: number,
            cfg: TierConfig,
            angle: number,
            fadeIn: boolean
        ): Particle => {
            const spreadBand = Math.min(canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height) * contentScale * 0.18;
            const targetR = cfg.minRadius + Math.random() * (cfg.maxRadius - cfg.minRadius);
            const minDist = avatarRadius + cfg.orbitPadding + targetR;
            const orbitDist = minDist + Math.random() * spreadBand;
            const speed = 0.3 + (Math.random() - 0.5) * 0.2;
            return {
                x: cx + Math.cos(angle) * orbitDist,
                y: cy + Math.sin(angle) * orbitDist,
                vx: -Math.sin(angle) * speed,
                vy: Math.cos(angle) * speed,
                radius: fadeIn ? 0 : targetR,
                targetRadius: targetR,
                alpha: fadeIn ? 0 : 0.55 + Math.random() * 0.35,
                targetAlpha: 0.55 + Math.random() * 0.35,
                removing: false,
            };
        };

        const initializeParticles = () => {
            const { w, h, dpr, effectiveSize } = getDimensions();
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            ctx.scale(dpr, dpr);

            const cfg = targetCfgRef.current;
            currentCfgRef.current = { ...cfg };
            avatarFractionRef.current = cfg.avatarFraction;

            const cx = w / 2;
            const cy = h / 2;
            const avatarRadius = effectiveSize * cfg.avatarFraction;

            particlesRef.current = [];
            pulsesRef.current = [];

            for (let i = 0; i < cfg.count; i++) {
                const baseAngle = (i / cfg.count) * Math.PI * 2;
                const jitter = (Math.random() - 0.5) * 0.6;
                particlesRef.current.push(spawnParticle(cx, cy, avatarRadius, cfg, baseAngle + jitter, false));
            }
        };

        const transitionTier = (newTierIndex: number) => {
            const newCfg = TIER_CONFIGS[Math.min(Math.max(newTierIndex, 0), TIER_CONFIGS.length - 1)];
            const { w, h, effectiveSize } = getDimensions();
            const cx = w / 2;
            const cy = h / 2;
            const avatarRadius = effectiveSize * avatarFractionRef.current;

            const active = particlesRef.current.filter(p => !p.removing);

            // Assign new target radius to all surviving particles
            for (const p of active) {
                p.targetRadius = newCfg.minRadius + Math.random() * (newCfg.maxRadius - newCfg.minRadius);
                p.targetAlpha = 0.55 + Math.random() * 0.35;
            }

            const diff = newCfg.count - active.length;

            if (diff > 0) {
                // Spawn new particles that fade in
                for (let i = 0; i < diff; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    particlesRef.current.push(spawnParticle(cx, cy, avatarRadius, newCfg, angle, true));
                }
            } else if (diff < 0) {
                // Mark excess particles for removal
                const toRemove = active.slice(active.length + diff);
                for (const p of toRemove) {
                    p.removing = true;
                    p.targetRadius = 0;
                    p.targetAlpha = 0;
                }
            }

            // Clear pulses on tier change to avoid stale indices
            pulsesRef.current = [];
        };

        initParticlesRef.current = initializeParticles;
        transitionTierRef.current = transitionTier;

        const animate = () => {
            // Lerp config toward target
            currentCfgRef.current = lerpConfig(currentCfgRef.current, targetCfgRef.current, LERP_RATE_CONFIG);
            // Lerp avatar fraction separately (slower = more dramatic)
            avatarFractionRef.current = lerp(avatarFractionRef.current, targetCfgRef.current.avatarFraction, LERP_RATE_AVATAR);

            const cfg = currentCfgRef.current;
            const { w, h, effectiveSize } = getDimensions();
            const cx = w / 2;
            const cy = h / 2;
            const avatarRadius = effectiveSize * avatarFractionRef.current;

            ctx.clearRect(0, 0, w, h);

            const particles = particlesRef.current;

            // Lerp particle sizes / alphas; cull fully-faded removals
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.radius = lerp(p.radius, p.targetRadius, LERP_RATE_PARTICLE);
                p.alpha = lerp(p.alpha, p.targetAlpha, LERP_RATE_PARTICLE);
                if (p.removing && p.radius < 0.5 && p.alpha < 0.01) {
                    particles.splice(i, 1);
                }
            }

            // Physics
            for (const p of particles) {
                const dx = cx - p.x;
                const dy = cy - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const ux = dx / dist;
                const uy = dy / dist;

                p.vx += ux * cfg.attractionForce;
                p.vy += uy * cfg.attractionForce;

                // Avatar exclusion zone
                const innerBound = avatarRadius + cfg.orbitPadding + p.radius;
                if (dist < innerBound) {
                    const overlap = innerBound - dist;
                    p.vx -= ux * overlap * 0.08;
                    p.vy -= uy * overlap * 0.08;
                }

                // Orbital tangential drift (clockwise)
                p.vx += (-uy) * cfg.orbitalDrift;
                p.vy += (ux) * cfg.orbitalDrift;

                p.vx += (Math.random() - 0.5) * 0.008;
                p.vy += (Math.random() - 0.5) * 0.008;

                p.vx *= cfg.damping;
                p.vy *= cfg.damping;
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.vx += 0.15;
                if (p.x > w) p.vx -= 0.15;
                if (p.y < 0) p.vy += 0.15;
                if (p.y > h) p.vy -= 0.15;

                // Circular boundary — soft pressure zone starting at 78% of radius
                if (circular) {
                    const r = effectiveSize / 2;
                    const softZone = r * 0.78;
                    const pdx = p.x - cx;
                    const pdy = p.y - cy;
                    const pdist = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
                    if (pdist > softZone) {
                        const excess = (pdist - softZone) / (r - softZone); // 0→1 across the zone
                        const push = excess * excess * 0.12;
                        p.vx -= (pdx / pdist) * push;
                        p.vy -= (pdy / pdist) * push;
                    }
                }
            }

            // Particle-particle repulsion
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const p1 = particles[i];
                    const p2 = particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    if (dist < cfg.repulsionDistance) {
                        const angle = Math.atan2(dy, dx);
                        const force = (cfg.repulsionDistance - dist) * cfg.repulsionForce;
                        p1.vx += Math.cos(angle) * force;
                        p1.vy += Math.sin(angle) * force;
                        p2.vx -= Math.cos(angle) * force;
                        p2.vy -= Math.sin(angle) * force;
                    }
                }
            }

            // Draw links
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const p1 = particles[i];
                    const p2 = particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < cfg.linkDistance) {
                        const baseOpacity = (1 - dist / cfg.linkDistance) * cfg.linkOpacity;
                        const opacity = baseOpacity * Math.min(p1.alpha / 0.6, 1) * Math.min(p2.alpha / 0.6, 1);
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(${LINK_RGB}, ${opacity})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }

            // Spawn pulses
            if (pulsesRef.current.length < cfg.maxPulses && Math.random() < cfg.pulseSpawnChance) {
                const active = particles.filter(p => !p.removing && p.alpha > 0.2);
                if (active.length >= 2) {
                    const i = Math.floor(Math.random() * active.length);
                    let j = Math.floor(Math.random() * active.length);
                    if (j === i) j = (i + 1) % active.length;
                    const pi = particles.indexOf(active[i]);
                    const pj = particles.indexOf(active[j]);
                    const dx = particles[pj].x - particles[pi].x;
                    const dy = particles[pj].y - particles[pi].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < cfg.linkDistance && dist > 20) {
                        pulsesRef.current.push({ fromIndex: pi, toIndex: pj, progress: 0 });
                    }
                }
            }

            // Draw pulses
            for (let k = pulsesRef.current.length - 1; k >= 0; k--) {
                const pulse = pulsesRef.current[k];
                const from = particles[pulse.fromIndex];
                const to = particles[pulse.toIndex];
                if (!from || !to || from.removing || to.removing) {
                    pulsesRef.current.splice(k, 1);
                    continue;
                }
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                pulse.progress += cfg.pulseSpeed;
                if (pulse.progress >= dist) {
                    pulsesRef.current.splice(k, 1);
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
                ctx.ellipse(0, 0, cfg.pulseGlowRadius * 2.4, Math.max(cfg.pulseGlowRadius * 0.85, 0.9), 0, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${PARTICLE_RGB}, 0.18)`;
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(0, 0, cfg.pulseCoreRadius * 2.6, Math.max(cfg.pulseCoreRadius, 0.7), 0, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${PARTICLE_RGB}, 0.92)`;
                ctx.shadowColor = `rgba(${PARTICLE_RGB}, 0.65)`;
                ctx.shadowBlur = 12;
                ctx.fill();
                ctx.restore();
            }

            // Draw particles
            for (const p of particles) {
                if (p.radius < 0.5) continue;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${PARTICLE_RGB}, ${p.alpha})`;
                ctx.fill();
            }

            // Draw avatar
            const img = imageRef.current;
            const borderR = avatarRadius + AVATAR_BORDER_WIDTH;

            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, borderR, 0, Math.PI * 2);
            ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 3;
            ctx.fillStyle = "white";
            ctx.fill();
            ctx.restore();

            if (img && img.complete && img.naturalWidth > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, avatarRadius, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(img, cx - avatarRadius, cy - avatarRadius, avatarRadius * 2, avatarRadius * 2);
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(cx, cy, avatarRadius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${PARTICLE_RGB}, 0.2)`;
                ctx.fill();
            }

            animationRef.current = window.requestAnimationFrame(animate);
        };

        initializeParticles();
        // Kick off the first transition in case tierIndex != 0 at mount
        const initialTier = Math.min(Math.max(tierIndex, 0), TIER_CONFIGS.length - 1);
        if (initialTier !== 0) {
            targetCfgRef.current = { ...TIER_CONFIGS[initialTier] };
        }
        animate();

        return () => {
            if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const maskImage = circular
        ? "radial-gradient(circle at 50% 50%, black 70%, transparent 92%)"
        : "radial-gradient(ellipse 78% 82% at 44% 50%, black 35%, transparent 95%)";

    return (
        <canvas
            ref={canvasRef}
            className={cn("absolute inset-0 w-full h-full", className)}
            style={{ maskImage, WebkitMaskImage: maskImage }}
        />
    );
};
