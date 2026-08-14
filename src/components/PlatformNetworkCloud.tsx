import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Zap, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import ShinyLogo from './ShinyLogo';

interface PlatformNode {
  id: string;
  name: string;
  color: string;
  shadowColor: string;
  logo: string;
  status: string;
  speed: string;
  // Three-dimensional base coordinates on a sphere
  bx: number;
  by: number;
  bz: number;
}

// Background stardust particles for 3D parallax depth
interface SpaceDust {
  x: number;
  y: number;
  z: number;
}

const orbitalParams: Record<string, { r: number; speed: number; phase: number; inclination: number }> = {
  tg: { r: 80, speed: 1.5, phase: 0.0, inclination: -0.15 },
  vk: { r: 100, speed: 1.25, phase: 1.2, inclination: 0.25 },
  ok: { r: 120, speed: 1.1, phase: 5.7, inclination: 0.4 },
  fb: { r: 140, speed: 0.95, phase: 2.1, inclination: -0.3 },
  instagram: { r: 160, speed: 0.85, phase: 0.8, inclination: 0.3 },
  tiktok: { r: 180, speed: 0.75, phase: 3.2, inclination: -0.4 },
  max: { r: 200, speed: 0.68, phase: 1.9, inclination: 0.35 },
  pinterest: { r: 220, speed: 0.6, phase: 4.1, inclination: 0.15 },
  linkedin: { r: 240, speed: 0.54, phase: 2.7, inclination: -0.25 },
  discord: { r: 260, speed: 0.48, phase: 5.2, inclination: 0.2 },
  x: { r: 280, speed: 0.42, phase: 0.4, inclination: -0.12 },
  dzen: { r: 300, speed: 0.36, phase: 2.5, inclination: -0.35 },
  tenchat: { r: 320, speed: 0.32, phase: 4.9, inclination: -0.28 },
  setka: { r: 340, speed: 0.28, phase: 3.8, inclination: 0.12 }
};

export function PlatformNetworkCloud() {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [pulseCounter, setPulseCounter] = useState(389);

  // Define 14 platform nodes spread across the orbits
  const initialNodes: PlatformNode[] = [
    { id: 'tg', name: 'Telegram', color: '#24A1DE', shadowColor: 'rgba(36,161,222,0.6)', logo: 'tg', status: 'Шлюз: Онлайн', speed: '5 мс', bx: 0, by: -1, bz: 0 },
    { id: 'vk', name: 'ВКонтакте', color: '#0077FF', shadowColor: 'rgba(0,119,255,0.6)', logo: 'vk', status: 'API Коннект', speed: '8 мс', bx: 0.9, by: -0.2, bz: 0.4 },
    { id: 'ok', name: 'Одноклассники', color: '#F2720C', shadowColor: 'rgba(242,114,12,0.6)', logo: 'ok', status: 'Пулл Активен', speed: '10 мс', bx: 0, by: 0.2, bz: -1 },
    { id: 'fb', name: 'Facebook', color: '#1877F2', shadowColor: 'rgba(24,119,242,0.6)', logo: 'fb', status: 'META Шлюз', speed: '11 мс', bx: 0.7, by: 0.4, bz: -0.5 },
    { id: 'instagram', name: 'Instagram', color: '#E1306C', shadowColor: 'rgba(225,48,108,0.6)', logo: 'instagram', status: 'Прямой Постинг', speed: '7 мс', bx: -0.3, by: -0.8, bz: 0.6 },
    { id: 'tiktok', name: 'TikTok', color: '#000000', shadowColor: 'rgba(0,0,0,0.6)', logo: 'tiktok', status: 'Видео Стриминг', speed: '9 мс', bx: -0.6, by: -0.5, bz: -0.7 },
    { id: 'max', name: 'Max', color: '#002CC4', shadowColor: 'rgba(0,44,196,0.6)', logo: 'max', status: 'Трансляция', speed: '16 мс', bx: -0.1, by: 0.9, bz: -0.9 },
    { id: 'pinterest', name: 'Pinterest', color: '#BD081C', shadowColor: 'rgba(189,8,28,0.6)', logo: 'pinterest', status: 'Доски Активны', speed: '14 мс', bx: 0.4, by: -0.6, bz: -0.3 },
    { id: 'linkedin', name: 'LinkedIn', color: '#0077B5', shadowColor: 'rgba(0,119,181,0.6)', logo: 'linkedin', status: 'Про Коннект', speed: '13 мс', bx: -0.8, by: 0.5, bz: 0.5 },
    { id: 'discord', name: 'Discord', color: '#5865F2', shadowColor: 'rgba(88,101,242,0.6)', logo: 'discord', status: 'Сервер Онлайн', speed: '6 мс', bx: 0.2, by: 0.8, bz: -0.2 },
    { id: 'x', name: 'Twitter / X', color: '#111111', shadowColor: 'rgba(17,17,17,0.6)', logo: 'x', status: 'X API Шлюз', speed: '6 мс', bx: 0.8, by: -0.7, bz: 0.1 },
    { id: 'dzen', name: 'Дзен', color: '#FF3300', shadowColor: 'rgba(255,51,0,0.6)', logo: 'dzen', status: 'Синхронизация', speed: '12 мс', bx: 0.5, by: 0.7, bz: 0.8 },
    { id: 'tenchat', name: 'TenChat', color: '#FF0055', shadowColor: 'rgba(255,0,85,0.6)', logo: 'tenchat', status: 'Стабилен', speed: '15 мс', bx: -0.9, by: -0.2, bz: 0.4 },
    { id: 'setka', name: 'Сетка', color: '#3c096c', shadowColor: 'rgba(60,9,108,0.6)', logo: 'setka', status: 'Бизнес Связь', speed: '4 мс', bx: -0.5, by: 0.7, bz: -0.8 }
  ];

  // Keep 12 background starry field dust ref elements
  const dustRef = useRef<SpaceDust[]>([
    { x: -140, y: -70, z: -100 },
    { x: 130, y: -110, z: -50 },
    { x: -90, y: 120, z: -80 },
    { x: 120, y: 90, z: -150 },
    { x: -150, y: -120, z: 80 },
    { x: 160, y: -50, z: 120 },
    { x: -40, y: 150, z: 60 },
    { x: 140, y: 130, z: 100 },
    { x: -100, y: -40, z: -120 },
    { x: 50, y: -130, z: -90 },
    { x: -70, y: -100, z: 150 },
    { x: 90, y: 140, z: -40 }
  ]);

  const angleRef = useRef({ yaw: 0, pitch: 0 });
  const dynamicOrbitsRef = useRef<Record<string, { 
    currentR: number; 
    targetR: number; 
    lastLoopCount: number; 
    baseR: number; 
    speed: number; 
    phase: number; 
    inclination: number;
  }>>({});

  // Render correct clean white brand SVGs or provided high-resolution PNGs
  const renderPlatformIcon = (logo: string) => {
    switch (logo) {
      case 'tg':
        return (
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-white fill-current">
            <path d="M19.897 5.115l-17.1 6.59c-1.17.47-1.16 1.12-.22 1.41l4.39 1.37 10.16-6.41c.48-.29.92-.13.56.19l-8.24 7.44-.32 4.79c.47 0 .68-.21.94-.47l2.25-2.19 4.68 3.46c.86.48 1.48.23 1.69-.8l3.07-14.47c.31-1.26-.48-1.83-1.32-1.37z" />
          </svg>
        );
      case 'vk':
        return (
          <img 
            src="/file/5/vklogo.png" 
            alt="VK" 
            referrerPolicy="no-referrer"
            className="w-[20px] h-[20px] object-contain inline-block"
            style={{ width: 20, height: 20 }}
          />
        );
      case 'ok':
        return (
          <img 
            src="/file/4/oklogo.png" 
            alt="Одноклассники" 
            referrerPolicy="no-referrer"
            className="w-[20px] h-[20px] object-contain inline-block"
            style={{ width: 20, height: 20 }}
          />
        );
      case 'fb':
        return (
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-white fill-current">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'instagram':
        return (
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-white fill-current">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
          </svg>
        );
      case 'tiktok':
        return (
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-white fill-current">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.62 4.17 1.23 1.33 2.95 2.06 4.78 2.15v3.91c-1.63-.04-3.23-.59-4.54-1.58-.1-.08-.2-.16-.3-.24v6.1C18 19.43 14.18 23 9.49 23 4.85 23 1 19.16 1 14.5c0-4.63 3.77-8.4 8.4-8.4.38 0 .76.03 1.13.08V10.1c-.37-.08-.75-.11-1.13-.11-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5c2.3 0 4.19-1.74 4.47-3.99.02-.13.03-.27.03-.4V.02z" />
          </svg>
        );
      case 'max':
        return (
          <img 
            src="/file/7/maxlogo.png" 
            alt="Max" 
            referrerPolicy="no-referrer"
            className="w-[18px] h-[18px] rounded-full object-contain"
          />
        );
      case 'pinterest':
        return (
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-white fill-current">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.993-.283 1.194.599 2.169 1.775 2.169 2.13 0 3.769-2.246 3.769-5.489 0-2.871-2.063-4.878-5.01-4.878-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.3.3 0 0 1 .069.288c-.098.407-.315 1.286-.358 1.458-.057.233-.189.282-.435.168-1.625-.755-2.639-3.13-2.639-5.035 0-4.099 2.981-7.863 8.588-7.863 4.509 0 8.014 3.213 8.014 7.509 0 4.479-2.824 8.083-6.742 8.083-1.317 0-2.556-.684-2.98-1.492 0 0-.651 2.478-.81 3.085-.292 1.119-1.082 2.522-1.612 3.385C10.29 23.903 11.134 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
          </svg>
        );
      case 'linkedin':
        return (
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-white fill-current">
            <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zm15.11 13.02h-3.56v-5.6c0-1.34-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.7H9.33V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z" />
          </svg>
        );
      case 'discord':
        return (
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-white fill-current">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 .074.074 0 0 0-.085-.03c-.225-.395-.466-.885-.683-1.25a.074.074 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.075.075 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.1825 0-2.1569-1.085-2.1569-2.42s.9556-2.416 2.157-2.416c1.21 0 2.176 1.096 2.157 2.416 0 1.335-.956 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.085-2.157-2.42s.956-2.416 2.157-2.416c1.21 0 2.176 1.096 2.157 2.416 0 1.335-.946 2.42-2.157 2.42z" />
          </svg>
        );
      case 'x':
        return (
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-white fill-current">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        );
      case 'dzen':
        return (
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-white fill-current">
            <path d="M12 2c0 5.523 4.477 10 10 10-5.523 0-10 4.477-10 10 0-5.523-4.477-10-10-10 5.523 0 10-4.477 10-10z" />
          </svg>
        );
      case 'tenchat':
        return (
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-white fill-current">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-5H7V9h8v2h-2v5z" />
          </svg>
        );
      case 'setka':
        return (
          <img 
            src="/file/6/setka2.png" 
            alt="Сетка" 
            referrerPolicy="no-referrer"
            className="w-[18px] h-[18px] object-contain inline-block shrink-0 fill-none"
            style={{ width: 18, height: 18 }}
          />
        );
      default:
        return <Globe className="w-[18px] h-[18px] text-white" />;
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      mousePosRef.current.targetX = (x / (rect.width / 2)) * 0.45;
      mousePosRef.current.targetY = (y / (rect.height / 2)) * 0.45;
    };

    const handleMouseLeave = () => {
      mousePosRef.current.targetX = 0;
      mousePosRef.current.targetY = 0;
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (element) {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  // Central 3D render loop inside a requestAnimationFrame
  useEffect(() => {
    const animate = () => {
      const mouse = mousePosRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      angleRef.current.yaw += 0.005; // orbit speed
      angleRef.current.pitch = 0.25 + mouse.y * 1.0; 
      const currentYaw = angleRef.current.yaw + mouse.x * 1.0; 
      const currentPitch = angleRef.current.pitch;

      const cosYaw = Math.cos(currentYaw);
      const sinYaw = Math.sin(currentYaw);
      const cosPitch = Math.cos(currentPitch);
      const sinPitch = Math.sin(currentPitch);

      const fov = 320; 

      const viewportEl = containerRef.current?.querySelector('.viewport-3d') || containerRef.current;
      const width = viewportEl?.clientWidth || 400;
      const height = viewportEl?.clientHeight || 240;
      const cx = width / 2;
      const cy = height / 2;

      const sunX = cx;
      const sunY = cy;

      if (Object.keys(dynamicOrbitsRef.current).length === 0) {
        initialNodes.forEach((node) => {
          const params = orbitalParams[node.id] || { r: 100, speed: 1, phase: 0, inclination: 0 };
          dynamicOrbitsRef.current[node.id] = {
            currentR: params.r,
            targetR: params.r,
            lastLoopCount: 0,
            baseR: params.r,
            speed: params.speed,
            phase: params.phase,
            inclination: params.inclination,
          };
        });
      }

      const elementsData = initialNodes.map((node) => {
        const dyn = dynamicOrbitsRef.current[node.id];
        if (!dyn) {
          return {
            id: node.id, name: node.name, color: node.color, shadowColor: node.shadowColor,
            logo: node.logo, status: node.status, speed: node.speed,
            projX: cx, projY: cy, projZ: 0, scale: 1, opacity: 1
          };
        }

        const now = Date.now() * 0.001;
        const theta = (now * dyn.speed) + dyn.phase;
        const currentLoopCount = Math.floor(theta / (2 * Math.PI));

        // When a node completes a revolution, assign a brand-new random radius
        if (currentLoopCount !== dyn.lastLoopCount) {
          // Keep a beautiful distribution of orbits
          const minR = 75;
          const maxR = 320;
          const nextR = Math.round(minR + Math.random() * (maxR - minR));
          dyn.targetR = nextR;
          dyn.lastLoopCount = currentLoopCount;
        }

        // Smooth spring ease interpolation to avoid instant jumps
        dyn.currentR += (dyn.targetR - dyn.currentR) * 0.045;

        const r = dyn.currentR;
        const x3D = Math.cos(theta) * r;
        const z3D = Math.sin(theta) * r;
        const y3D = Math.sin(theta * 0.4) * r * dyn.inclination;

        const x1 = x3D * cosYaw - z3D * sinYaw;
        const z1 = z3D * cosYaw + x3D * sinYaw;

        const y1 = y3D * cosPitch - z1 * sinPitch;
        const z2 = z1 * cosPitch + y3D * sinPitch;

        const scale = fov / (fov + z2);
        const projX = cx + x1 * scale;
        const projY = cy + y1 * scale;

        return {
          id: node.id,
          name: node.name,
          color: node.color,
          shadowColor: node.shadowColor,
          logo: node.logo,
          status: node.status,
          speed: node.speed,
          projX,
          projY,
          projZ: z2,
          scale,
          opacity: Math.max(0.2, (z2 + fov) / (fov * 1.5))
        };
      });

      // Dust Projection (background starry field)
      const dustData = dustRef.current.map((dust) => {
        const x1 = dust.x * cosYaw - dust.z * sinYaw;
        const z1 = dust.z * cosYaw + dust.x * sinYaw;
        const y1 = dust.y * cosPitch - z1 * sinPitch;
        const z2 = z1 * cosPitch + dust.y * sinPitch;

        const scale = fov / (fov + z2);
        const projX = cx + x1 * scale;
        const projY = cy + y1 * scale;

        return { projX, projY, size: scale * 1.8, opacity: Math.max(0.1, (z2 + fov) / (fov * 2.2)) };
      });

      if (containerRef.current) {
        dustData.forEach((dust, idx) => {
          const starEl = containerRef.current?.querySelector(`[data-star-idx="${idx}"]`) as HTMLElement;
          if (starEl) {
            starEl.style.transform = `translate3d(${dust.projX}px, ${dust.projY}px, 0)`;
            starEl.style.width = `${dust.size}px`;
            starEl.style.height = `${dust.size}px`;
            starEl.style.opacity = `${dust.opacity}`;
          }
        });

        const coreEl = containerRef.current?.querySelector('[data-core-brain]') as HTMLElement;
        if (coreEl) {
          coreEl.style.transform = `translate3d(${sunX}px, ${sunY}px, 0) translate(-50%, -50%)`;
          coreEl.style.left = '0';
          coreEl.style.top = '0';
          coreEl.style.position = 'absolute';
          coreEl.style.zIndex = '150'; // dynamic zIndex matching the median value
        }

        elementsData.forEach((node) => {
          const nodeEl = containerRef.current?.querySelector(`[data-platform-node="${node.id}"]`) as HTMLElement;
          if (nodeEl) {
            const finalScale = node.scale * (hoveredNodeId === node.id ? 1.25 : 1);
            nodeEl.style.transform = `translate3d(${node.projX}px, ${node.projY}px, 0) scale(${finalScale})`;
            nodeEl.style.opacity = node.opacity.toString();
            nodeEl.style.zIndex = Math.round(150 - node.projZ).toString();

            const indicator = nodeEl.querySelector('.node-active-mesh') as HTMLElement;
            if (indicator) {
              indicator.style.opacity = (node.projZ < 0 ? 0.35 : 0.95).toString();
            }
          }

          const ellipseEl = containerRef.current?.querySelector(`[data-orbit-track-id="${node.id}"]`) as SVGEllipseElement;
          if (ellipseEl) {
            const currentR = dynamicOrbitsRef.current[node.id]?.currentR || 100;
            const currentRy = Math.round(currentR * 0.22);
            ellipseEl.setAttribute('rx', currentR.toString());
            ellipseEl.setAttribute('ry', currentRy.toString());

            const isHovered = (hoveredNodeId === node.id);
            if (isHovered) {
              ellipseEl.setAttribute('stroke', node.id === 'tg' ? '#18a5e8' : node.color);
              ellipseEl.setAttribute('stroke-width', '1.8');
              ellipseEl.setAttribute('stroke-dasharray', '5 5');
              const dashOffset = (Date.now() * 0.15) % 40;
              ellipseEl.style.strokeDashoffset = `-${dashOffset}px`;
              ellipseEl.style.opacity = '0.55';
            } else {
              ellipseEl.setAttribute('stroke', 'rgba(148, 163, 184, 0.4)');
              ellipseEl.setAttribute('stroke-width', '0.95');
              ellipseEl.setAttribute('stroke-dasharray', node.id === 'tg' ? '3 5' : '4 6');
              ellipseEl.style.strokeDashoffset = '0';
              ellipseEl.style.opacity = node.id === 'tg' ? '0.22' : '0.07';
            }
          }

          const lineEl = containerRef.current?.querySelector(`[data-sun-edge-id="${node.id}"]`) as SVGLineElement;
          if (lineEl) {
            lineEl.setAttribute('x1', sunX.toString());
            lineEl.setAttribute('y1', sunY.toString());
            lineEl.setAttribute('x2', node.projX.toString());
            lineEl.setAttribute('y2', node.projY.toString());

            const isActiveConnection = (hoveredNodeId === node.id);
            const avgZ = node.projZ;
            const lineOpacity = Math.max(0.12, 0.55 * (avgZ + fov) / (fov * 1.5));
            const lineWidth = Math.max(0.7, 1.8 * (avgZ + fov) / (fov * 1.5));

            if (isActiveConnection) {
              lineEl.style.stroke = node.color;
              lineEl.style.opacity = '1.0';
              lineEl.style.strokeWidth = `${lineWidth * 1.5}px`;
              
              const offsetSpeed = 0.35;
              const dashOffset = (Date.now() * offsetSpeed) % 40;
              lineEl.setAttribute('stroke-dasharray', '4 4');
              lineEl.style.strokeDashoffset = `-${dashOffset}px`;
            } else {
              lineEl.style.stroke = 'rgba(148, 163, 184, 0.4)';
              lineEl.style.opacity = lineOpacity.toString();
              lineEl.style.strokeWidth = `${lineWidth}px`;
              lineEl.setAttribute('stroke-dasharray', '3 4');
              lineEl.style.strokeDashoffset = '0';
            }
          }
        });
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [hoveredNodeId]);

  const handleNodeClick = (id: string, color: string) => {
    setPulseCounter(prev => prev + 1);
    if (containerRef.current) {
      const core = containerRef.current.querySelector('[data-core-brain]');
      if (core) {
        core.classList.add('scale-110');
        setTimeout(() => core.classList.remove('scale-110'), 180);
      }
    }
  };

  return (
    <div 
      className="relative w-full h-[340px] md:h-[420px] overflow-visible select-none bg-transparent" 
      id="3d-network-mesh-hero"
      ref={containerRef}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Space dust mapping */}
        {dustRef.current.map((_, idx) => (
          <div
            key={`star-${idx}`}
            data-star-idx={idx}
            className="absolute rounded-full bg-slate-300 pointer-events-none"
            style={{ width: '2px', height: '2px', transition: 'opacity 0.1s linear' }}
          />
        ))}

        {/* Central brain core */}
        <div
          data-core-brain
          className="absolute z-40 flex items-center justify-center pointer-events-none overflow-visible"
          style={{ transform: 'translate3d(0, 0, 0) translate(-50%, -50%)', left: 0, top: 0 }}
        >
          <div className="hidden md:block">
            <ShinyLogo height={192} />
          </div>
          <div className="block md:hidden">
            <ShinyLogo height={77} />
          </div>
        </div>

        {/* Responsive Connections SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {/* Dynamic Orbit Track Ellipses */}
          {initialNodes.map((node, index) => {
            const params = orbitalParams[node.id] || { r: 100 };
            const rot = (index * (360 / initialNodes.length)) - 30;
            const ry = Math.round(params.r * 0.22);
            return (
              <ellipse 
                key={`orbit-track-${node.id}`}
                data-orbit-track-id={node.id}
                cx="50%" 
                cy="50%" 
                rx={params.r} 
                ry={ry} 
                fill="none" 
                stroke="rgba(148, 163, 184, 0.05)" 
                strokeWidth="1.1" 
                strokeDasharray="4 6" 
                style={{ transform: `rotate(${rot}deg)` }} 
                className="origin-center" 
              />
            );
          })}

          {/* Connection radial elements */}
          {initialNodes.map((node) => (
            <line
              key={`line-${node.id}`}
              data-sun-edge-id={node.id}
              stroke="rgba(148, 163, 184, 0.35)"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              className="transition-all duration-200"
            />
          ))}
        </svg>

        {/* Floating platform planets */}
        {initialNodes.map((node) => (
          <div
            key={node.id}
            data-platform-node={node.id}
            className="absolute z-20 cursor-pointer"
            style={{ left: 0, top: 0, width: '38px', height: '38px', margin: '-19px 0 0 -19px' }}
            onMouseEnter={() => setHoveredNodeId(node.id)}
            onMouseLeave={() => setHoveredNodeId(null)}
            onClick={() => handleNodeClick(node.id, node.color)}
          >
            {/* Volumetric planet ball */}
            <div 
              className="w-full h-full rounded-full flex items-center justify-center border shadow-xl transition-all duration-300"
              style={{
                backgroundColor: node.color,
                borderColor: hoveredNodeId === node.id ? '#ffffff' : 'rgba(255,255,255,0.7)',
                boxShadow: hoveredNodeId === node.id 
                  ? `0 0 22px ${node.color}, inset 0 2.5px 4.5px rgba(255,255,255,0.65)` 
                  : `0 4px 7px -1px rgba(0,0,0,0.12), inset 0 1.5px 3px rgba(255,255,255,0.55)`,
                background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.3) 100%), ${node.color}`
              }}
            >
              <span className="drop-shadow-md text-white">
                {renderPlatformIcon(node.logo)}
              </span>

              {/* Pulse overlays */}
              <div className="absolute -inset-1 rounded-full border border-white/20 animate-pulse node-active-mesh pointer-events-none" />

              {/* Rings around active cursor halo */}
              {hoveredNodeId === node.id && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2"
                  style={{ borderColor: node.color }}
                  initial={{ scale: 1, opacity: 0.9 }}
                  animate={{ scale: 1.62, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.25, ease: 'easeOut' }}
                />
              )}
            </div>

            {/* Tooltip on Hover */}
            <div className={`absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 px-1.5 py-0.5 rounded shadow-[0_1px_3px_rgba(0,0,0,0.12)] border border-slate-150/80 text-[8.5px] font-black text-slate-800 uppercase tracking-wider transition-opacity duration-200 pointer-events-none ${hoveredNodeId === node.id ? 'opacity-100' : 'opacity-0'}`}>
              {node.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
