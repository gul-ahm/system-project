"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useMotionTemplate } from 'framer-motion';
import { 
  Menu, X, ChevronRight, Github, Linkedin, Mail, Phone, 
  Database, Brain, Layers, Rocket, Settings, Upload, 
  Image as ImageIcon, Save, DollarSign, Send, Lock, Key,
  MessageSquare, Sparkles, Cpu, Activity, Users, Globe, CheckCircle,
  Code, Cloud, BarChart3, LayoutDashboard, FileText, Bell, LogOut, Plus, Trash2,
  MapPin, CreditCard, Terminal, Server, Atom, FileCode, Wand2, RefreshCw, Shuffle, Lightbulb
} from 'lucide-react';
import * as THREE from 'three';

/**
 * DATA LAYER
 */
const PROFILE = {
  name: "Gulzar Ahmed",
  role: "Data Scientist & Full-Stack Architect",
  slogan: "Our motive first serve then ask", 
  tagline: "Forging Intelligence from Chaos",
  education: "B.Tech in CSE (Specialization in AI)",
  availability: "Available Remotely (Global)",
  team: "10-12 Member Organized Workspace",
  pricing: {
    consultation: "Free",
    project_start: "45 USD"
  },
  contact: {
    emails: ["gulzar.ahmed79033@gmail.com", "gzar92471@gmail.com"],
    phone: "+917091319448",
    linkedin: "https://linkedin.com/in/gulzar-ahm",
    linkedin_handle: "Gulzar-ahm",
    address: "St Mary Road, Mazgaon, Mumbai, Maharashtra, India, 400010"
  },
  expertise: [
    { id: 1, name: "Data Science & Mining", icon: Database, level: 98, detail: "ETL pipelines, feature engineering, statistical exploration, anomaly detection.", delivery: "Pipeline / Insight: 2–6w (5y exp)" },
    { id: 2, name: "AI/ML & Deep Learning", icon: Brain, level: 95, detail: "Model selection, training, hyperparameter tuning, MLOps packaging.", delivery: "Model Cycle: 3–8w (5y exp)" },
    { id: 3, name: "Web3 & Blockchain", icon: Layers, level: 85, detail: "Smart contracts, token design, security review, chain integration.", delivery: "Contract Suite: 2–5w (3y exp)" },
    { id: 4, name: "Web Development", icon: Code, level: 92, detail: "Full-stack architecture, component systems, API shaping, performance.", delivery: "Production App: 4–10w (6y exp)" },
    { id: 5, name: "Sales Forecasting", icon: BarChart3, level: 88, detail: "Time series modeling, seasonality, promo uplift, inventory signals.", delivery: "Forecast Engine: 2–4w (4y exp)" },
    { id: 6, name: "Meta & Google Ads", icon: Activity, level: 90, detail: "Budget algorithms, targeting refinement, ROAS optimization dashboards.", delivery: "Automation Suite: 1–3w (4y exp)" },
    { id: 7, name: "NLP & LLM (RAG)", icon: MessageSquare, level: 94, detail: "Embedding strategy, retrieval indexing, prompt orchestration, eval harness.", delivery: "RAG System: 2–5w (3y exp)" },
    { id: 8, name: "Cloud Services", icon: Cloud, level: 89, detail: "Scalable infra, cost optimization, IaC, container orchestration.", delivery: "Infra Scaling: 1–3w (5y exp)" },
  ]
};

const SKILLS_LOGOS = [
  { name: "React", icon: Atom, color: "text-cyan-400" },
  { name: "Python", icon: Terminal, color: "text-yellow-400" },
  { name: "Java", icon: FileCode, color: "text-red-400" },
  { name: "Data Mining", icon: Database, color: "text-purple-400" },
  { name: "AI & ML", icon: Brain, color: "text-pink-400" },
  { name: "Cloud API", icon: Cloud, color: "text-blue-400" },
  { name: "Payments", icon: CreditCard, color: "text-green-400" },
  { name: "Backend", icon: Server, color: "text-orange-400" },
];

const SKILL_DETAILS: Record<string,string> = {
  React: "Component-driven UI, SSR/ISR patterns, concurrent features, accessibility and performance tuning.",
  Python: "Data pipelines (Pandas), ML training (TensorFlow/PyTorch), orchestration & automation scripts.",
  Java: "High-throughput backend services, JVM tuning, concurrency, enterprise-grade integrations.",
  "Data Mining": "ETL staging, pattern discovery, dimensional reduction, quality validation, enrichment.",
  "AI & ML": "Model lifecycle, experiment tracking, metrics baselining, deployment & monitoring.",
  "Cloud API": "AWS/GCP provisioning, serverless/event design, observability, scaling & cost control.",
  Payments: "Secure payment flows, Stripe/Razorpay integration, idempotency, PCI-conscious abstractions.",
  Backend: "GraphQL/REST API design, caching layers, queue workers, containerization & CI/CD pipelines.",
};

const MOCK_PROJECTS = [
  {
    id: "ai-sales-forecaster",
    title: "AI Sales Predictor",
    category: "Machine Learning",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop",
    description: "LSTM neural network for precise sales forecasting and inventory management.",
    tech: ["Python", "TensorFlow", "Pandas"],
    costSpent: 0
  },
  {
    id: "web3-defi",
    title: "DeFi Exchange",
    category: "Web3 Development",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1000&auto=format&fit=crop",
    description: "Decentralized trading platform with smart contract integration.",
    tech: ["Solidity", "React", "Web3.js"],
    costSpent: 0
  },
  {
    id: "ads-optimizer",
    title: "Ad ROI Optimizer",
    category: "Marketing Tech",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop",
    description: "Automated budget allocation script for Meta & Google Ads.",
    tech: ["Python API", "Marketing API"],
    costSpent: 0
  },
  {
    id: "nlp-bot",
    title: "Contextual RAG Bot",
    category: "AI & NLP",
    image: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?q=80&w=1000&auto=format&fit=crop",
    description: "Customer support bot using Retrieval-Augmented Generation for business data.",
    tech: ["LLM", "LangChain", "Python"],
    costSpent: 0
  }
];

const ADMIN_KEY = "gcjsdhgbcjsdghsuydgsuidhbcsijdbncjncbhfgvyvbh ndbksdj9we87r623990293802i938r92u@&y4837928392472983u92382974826348732y4928u498236420102#8493874938u9027498274029";

/**
 * HOOK: NATIVE SOUND (Web Audio API)
 */
const useNativeSound = (enabled: boolean = true) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
      }
    }
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playTap = () => {
    if (!enabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  };

  const playSynth = (type: 'success' | 'swipe' | 'hover' = 'hover') => {
    if (!enabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'swipe') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.2);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else {
      // hover
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  };

  return { playTap, playSynth };
};

/**
 * GEMINI API UTILITY
 */
const callGemini = async (prompt: string, systemPrompt: string = "") => {
  const apiKey = ""; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };

  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis unavailable.";
    } catch (e) {
      if (i === 4) return "System busy. Try again later.";
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
};

/**
 * 3D COMPONENT: NEURAL CLOUD
 */
const ThreeBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050507, 0.02);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);

    const color1 = new THREE.Color(0x00ffff); 
    const color2 = new THREE.Color(0xff00ff); 

    for(let i = 0; i < particlesCount * 3; i+=3) {
        const r = 10 * Math.cbrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        posArray[i] = x;
        posArray[i+1] = y;
        posArray[i+2] = z;

        const mixedColor = color1.clone().lerp(color2, Math.random());
        colorsArray[i] = mixedColor.r;
        colorsArray[i+1] = mixedColor.g;
        colorsArray[i+2] = mixedColor.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.03,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth - 0.5;
      mouseRef.current.y = e.clientY / window.innerHeight - 0.5;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    const clock = new THREE.Clock();
    
    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      particlesMesh.rotation.y = elapsedTime * 0.05;
      particlesMesh.rotation.x = elapsedTime * 0.02;

      particlesMesh.rotation.x += (mouseRef.current.y * 0.5 - particlesMesh.rotation.x) * 0.05;
      particlesMesh.rotation.y += (mouseRef.current.x * 0.5 - particlesMesh.rotation.y) * 0.05;

      const scale = 1 + Math.sin(elapsedTime * 0.5) * 0.05;
      particlesMesh.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
};

/**
 * HELPER: HYDRO TILT WRAPPER (UPDATED WITH GLOW)
 * Now includes a bioluminescent cursor tracking effect
 */
const HydroTilt = ({ children, className = "", intensity = 1 }: { children: React.ReactNode, className?: string, intensity?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // New: Track absolute cursor position for glow
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${15 * intensity}deg`, `${-15 * intensity}deg`]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`${-15 * intensity}deg`, `${15 * intensity}deg`]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
    
    // Set cursor position for glow
    cursorX.set(mouseX);
    cursorY.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      animate={{ y: [0, -10 * intensity, 0] }}
      transition={{ y: { repeat: Infinity, duration: 3 + Math.random(), ease: "easeInOut" } }}
      className={`perspective-1000 ${className} relative group`}
    >
      {/* Bioluminescent Glow Layer */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 z-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              450px circle at ${cursorX}px ${cursorY}px,
              rgba(6, 182, 212, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};

/**
 * COMPONENT: ARC CAROUSEL
 */
const ArcCarousel = ({ projects, onSelect, playSound }: { projects: any[], onSelect: (p: any) => void, playSound: Function }) => {
  const [activeIndex, setActiveIndex] = useState(Math.floor(projects.length / 2));

  const getCardStyle = (index: number) => {
    const offset = index - activeIndex;
    const absOffset = Math.abs(offset);
    const isActive = offset === 0;
    
    return {
      y: absOffset * 40,
      scale: 1 - (absOffset * 0.1),
      rotateZ: offset * 5,
      opacity: 1 - (absOffset * 0.3),
      zIndex: 50 - absOffset,
      x: offset * 260,
      filter: isActive ? 'brightness(1.2) drop-shadow(0 0 30px rgba(6,182,212,0.4))' : 'brightness(0.4) grayscale(0.8)',
    };
  };

  const next = () => {
    if (activeIndex < projects.length - 1) {
      setActiveIndex(prev => prev + 1);
      playSound('swipe');
    }
  };

  const prev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
      playSound('swipe');
    }
  };

  return (
    <div className="relative h-[500px] flex items-center justify-center overflow-hidden touch-none py-10">
       <div className="relative w-full max-w-4xl h-full flex items-center justify-center perspective-[1000px]">
         <AnimatePresence>
           {projects.map((project, index) => {
             const style = getCardStyle(index);
             if (Math.abs(index - activeIndex) > 2) return null;

             return (
               <motion.div
                 key={project.id}
                 className="absolute w-[280px] md:w-[320px] h-[420px] cursor-pointer"
                 initial={false}
                 animate={style}
                 transition={{ type: "spring", stiffness: 300, damping: 30 }}
                 onClick={() => {
                   if (index === activeIndex) onSelect(project);
                   else {
                     setActiveIndex(index);
                     playSound('swipe');
                   }
                 }}
               >
                 <HydroTilt className="w-full h-full">
                   <div className="w-full h-full bg-[#0a0a0c] rounded-2xl overflow-hidden border border-cyan-500/30 relative group">
                     <img src={project.image} alt={project.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                     <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                     <div className="absolute bottom-0 left-0 p-6 w-full transform translate-z-10">
                        <div className="text-cyan-400 text-xs uppercase tracking-widest mb-1 font-mono">{project.category}</div>
                        <h3 className="text-2xl font-bold text-white leading-tight">{project.title}</h3>
                     </div>
                   </div>
                 </HydroTilt>
               </motion.div>
             );
           })}
         </AnimatePresence>
       </div>

       <div className="absolute bottom-0 left-0 w-full flex justify-center gap-8 z-20 pb-4">
         <button onClick={prev} disabled={activeIndex === 0} className="p-4 rounded-full bg-white/10 disabled:opacity-30 hover:bg-cyan-500/20 text-white transition-colors">
           <ChevronRight className="rotate-180" />
         </button>
         <div className="flex gap-2 items-center">
            {projects.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? 'bg-cyan-500 w-6' : 'bg-gray-700'}`} />
            ))}
         </div>
         <button onClick={next} disabled={activeIndex === projects.length - 1} className="p-4 rounded-full bg-white/10 disabled:opacity-30 hover:bg-cyan-500/20 text-white transition-colors">
           <ChevronRight />
         </button>
       </div>
    </div>
  );
};

/**
 * COMPONENT: NEURAL LINK (Chat Assistant)
 */
const NeuralLink = ({ close, playSound }: { close: () => void, playSound: Function }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    {role: 'ai', text: `Neural Link Established. I am G-OS. Queries regarding protocols or consultation?`}
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);
    playSound('click');

    const systemPrompt = `You are G-OS, the AI assistant for Gulzar Ahmed. 
    Slogan: ${PROFILE.slogan}.
    Team: ${PROFILE.team}.
    Expertise: ${PROFILE.expertise.map(e => e.name).join(', ')}.
    Pricing: Free Consultation, Project Execution $45+.
    Tone: Futuristic, Robotic but helpful, Brief.`;

    const response = await callGemini(userMsg, systemPrompt);
    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setIsLoading(false);
    playSound('success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-24 right-4 md:right-10 w-[90vw] md:w-[350px] h-[500px] bg-black/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 z-[80] flex flex-col overflow-hidden"
    >
      <div className="p-4 bg-cyan-900/20 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="font-mono text-xs font-bold tracking-widest text-cyan-300">NEURAL LINK v2.0</span>
        </div>
        <button onClick={close}><X size={16} className="text-gray-400 hover:text-white" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm border ${m.role === 'user' ? 'bg-cyan-700 text-white border-cyan-500' : 'bg-white/10 text-gray-300 border-white/10'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white/10 p-3 rounded-lg flex gap-1 border border-white/10">
               <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
               <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
               <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
             </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/80 flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Query system..."
          className="flex-1 bg-transparent border-none focus:outline-none text-sm font-mono text-cyan-200 placeholder-cyan-900"
        />
        <button type="submit" disabled={isLoading} className="p-2 bg-cyan-500/20 rounded hover:bg-cyan-500/40 text-cyan-300">
          <Send size={16} />
        </button>
      </form>
    </motion.div>
  );
}

/**
 * MAIN APPLICATION COMPONENT
 */
export default function App() {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsSaving, setProjectsSaving] = useState(false);

  // Load projects from API (GitHub or fallback)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (Array.isArray(data.projects)) setProjects(data.projects);
      } catch {
        setProjects(MOCK_PROJECTS); // fallback to embedded constant
      } finally {
        setProjectsLoading(false);
      }
    };
    load();
  }, []);

  const persistProjects = async (next: any[]) => {
    setProjects(next);
    setProjectsSaving(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: next })
      });
      const json = await res.json();
      if (!json.ok) {
        console.warn('Persist failed:', json.reason || json.error);
      }
    } catch (e) {
      console.warn('Persist error:', e);
    } finally {
      setProjectsSaving(false);
    }
  };
  
  const [contactMsg, setContactMsg] = useState('');
  const [contactName, setContactName] = useState('');
  const [drafting, setDrafting] = useState(false);

  // ✨ SYNERGY MODE STATE
  const [synergyMode, setSynergyMode] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [synergyResult, setSynergyResult] = useState<string | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);

  const { playTap, playSynth } = useNativeSound(soundEnabled);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `html { scroll-behavior: smooth; }`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const playSound = (type: 'hover' | 'click' | 'swipe' | 'success') => {
    if (!soundEnabled) return;
    
    // Use Web Audio API
    if (type === 'click') playTap();
    else playSynth(type);

    // Fallback to vibration if available
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'click') navigator.vibrate(10);
      if (type === 'swipe') navigator.vibrate(15);
      if (type === 'success') navigator.vibrate([10, 30, 10]);
    }
  };

  const runProjectAnalysis = async () => {
    if (!selectedProject) return;
    setAnalyzing(true);
    setAnalysis(null);
    const prompt = `Analyze the project "${selectedProject.title}" (${selectedProject.category}). Description: ${selectedProject.description}. Tech Stack: ${Array.isArray(selectedProject.tech) ? selectedProject.tech.join(', ') : selectedProject.tech}`;
    const result = await callGemini(prompt, "You are a senior technical architect. Provide a concise, professional review of this project, highlighting its technical complexity, potential business impact, and scalability. Avoid sci-fi jargon.");
    setAnalysis(result);
    setAnalyzing(false);
  };

  // ✨ SKILL HANDLER (Dual Mode)
  const handleSkillInteraction = async (skill: any) => {
    playSound('click');

    if (synergyMode) {
      // Synergy Mode: Toggle Selection
      setSelectedSkillIds(prev => 
        prev.includes(skill.id) 
          ? prev.filter(id => id !== skill.id) 
          : [...prev, skill.id]
      );
    } else {
      // Insight Mode: Generate single insight alert
      const prompt = `One punchy sentence on how ${skill.name} drives business ROI.`;
      const text = await callGemini(prompt, "You are a futuristic architect.");
      alert(`[AI INSIGHT]: ${text}`);
    }
  };

  // ✨ SYNERGY GENERATION
  const handleSynergyGenerate = async () => {
    if (selectedSkillIds.length < 2) return;
    setSynthesizing(true);
    setSynergyResult(null);
    playSound('click');

    const skills = PROFILE.expertise.filter(s => selectedSkillIds.includes(s.id)).map(s => s.name).join(' + ');
    const prompt = `Invent a unique, high-value digital product or business solution that combines: ${skills}. Format: "TITLE: [Cool Name] \n CONCEPT: [1 sentence description]"`;
    
    const result = await callGemini(prompt, "You are a visionary product architect.");
    setSynergyResult(result);
    setSynthesizing(false);
    playSound('success');
  };

  const handleMagicDraft = async () => {
    if (!contactMsg.trim() && !contactName) {
      alert("Please enter a brief topic or name first.");
      return;
    }
    setDrafting(true);
    playSound('click');

    const prompt = `Draft a professional project inquiry for Gulzar Ahmed (Data Scientist) based on this user input: "${contactMsg || "I have a project idea"}". Use terms from his stack: React, Python, AI. Keep it under 50 words.`;
    const draft = await callGemini(prompt);
    
    setContactMsg(draft);
    setDrafting(false);
    playSound('success');
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden relative">
      
      {/* 3D BACKGROUND LAYER */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ThreeBackground />
      </div>

      {/* HEADER */}
      <nav className="fixed top-0 left-0 w-full z-50 px-4 md:px-6 py-4 md:py-6 flex justify-between items-center backdrop-blur-md bg-black/30 border-b border-white/10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <h1 className="text-lg md:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-400">
            GULZAR<span className="text-cyan-500">.</span>AI
          </h1>
          <span className="text-[8px] md:text-[10px] text-cyan-400 uppercase tracking-[0.2em] font-semibold">Intelligence Architect</span>
        </motion.div>

        <div className="flex gap-3 md:gap-4">
           <button 
            onClick={() => setChatOpen(!chatOpen)}
            className="p-2 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all text-cyan-400 animate-pulse"
          >
            <MessageSquare size={18} />
          </button>
          <button 
            onClick={() => setAdminMode(true)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-gray-400"
          >
            <Settings size={18} />
          </button>
        </div>
      </nav>

      {/* CHAT */}
      <AnimatePresence>
        {chatOpen && <NeuralLink close={() => setChatOpen(false)} playSound={playSound} />}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="relative z-10 pt-28 md:pt-32 px-4 md:px-12 max-w-7xl mx-auto pb-24">
        
        {adminMode ? (
          <AdminPanel 
            close={() => setAdminMode(false)} 
            playSound={playSound} 
            projects={projects} 
            setProjects={setProjects} 
            persistProjects={persistProjects}
            projectsSaving={projectsSaving}
            projectsLoading={projectsLoading}
          />
        ) : (
          <div className="space-y-24 md:space-y-32">
            
            {/* HERO SECTION */}
            <section className="min-h-[60vh] flex flex-col justify-center">
              <div>
                <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-wide"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  {PROFILE.availability.toUpperCase()}
                </motion.div>

                <HydroTilt intensity={0.5} className="inline-block">
                  <motion.h2 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                    className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-600 cursor-default"
                  >
                     {PROFILE.slogan}
                  </motion.h2>
                </HydroTilt>
                
                <p className="max-w-2xl text-gray-400 text-base md:text-lg leading-relaxed mb-8 font-medium">
                  I am <span className="text-cyan-400 font-bold">{PROFILE.name}</span>, leading a <span className="text-white font-bold">10-12 member organized team</span>. 
                  {PROFILE.tagline}.
                </p>

                <div className="flex flex-wrap gap-4">
                   <button 
                    onClick={() => document.getElementById('contact')?.scrollIntoView({behavior: 'smooth'})}
                    className="bg-white text-black px-8 py-4 rounded-lg font-bold text-sm uppercase tracking-wide hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
                   >
                     Free Consultation
                   </button>
                   <div className="flex gap-3">
                     <SocialBtn icon={Linkedin} href={PROFILE.contact.linkedin} />
                     <SocialBtn icon={Phone} href={`https://wa.me/${PROFILE.contact.phone.replace('+','')}`} />
                   </div>
                </div>
              </div>
            </section>

            {/* EXPERTISE - SYNERGY ARCHITECT FEATURE */}
            <section className="relative">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Database size={20} className="text-cyan-500"/> Core Intelligence
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">
                    {synergyMode ? "Select multiple skills to architect a solution." : "Tap cards for individual insights."}
                  </p>
                </div>
                
                {/* Synergy Toggle */}
                <button 
                  onClick={() => {
                    setSynergyMode(!synergyMode); 
                    setSelectedSkillIds([]);
                    setSynergyResult(null);
                    playSound('click');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border
                    ${synergyMode 
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                    }`}
                >
                  <Shuffle size={14} /> {synergyMode ? "Synergy Active" : "Enable Synergy"}
                </button>
              </div>

              {/* Descriptive Overview */}
              <div className="mb-8 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-cyan-300 font-mono text-xs tracking-widest mb-3">CAPABILITY MATRIX</h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  This matrix captures engineering depth (experience years) and typical delivery windows for production-grade outcomes. Pipelines, models, contracts and full-stack builds are scoped with lean iteration loops, emphasizing reproducibility, observability and ROI acceleration. Timelines represent average ranges for initial deployable value; ongoing optimization cycles run in parallel.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 perspective-2000">
                {PROFILE.expertise.map((item) => {
                  const isSelected = selectedSkillIds.includes(item.id);
                  return (
                    <HydroTilt key={item.id} className="h-full">
                      <div 
                        onClick={() => handleSkillInteraction(item)}
                        className={`group relative p-6 h-full rounded-2xl backdrop-blur-lg border transition-all cursor-pointer
                          ${isSelected 
                            ? 'border-cyan-400 bg-cyan-900/40 shadow-[0_0_20px_rgba(34,211,238,0.3)] scale-105' 
                            : 'border-cyan-500/20 bg-cyan-950/10 hover:bg-cyan-900/20'}
                        `}
                      >
                        <div className="relative z-10">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors
                             ${isSelected ? 'bg-cyan-500 text-white' : 'bg-cyan-500/10 text-cyan-400'}
                          `}>
                            <item.icon size={24} />
                          </div>
                          <h4 className="text-lg font-bold text-white mb-2 tracking-wide">{item.name}</h4>
                          <p className="text-xs text-gray-400 leading-relaxed mb-3">{item.detail}</p>
                          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                            <span>{item.delivery}</span>
                          </div>
                          
                          {synergyMode && (
                            <div className={`w-4 h-4 rounded-full border absolute top-0 right-0
                              ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600'}
                            `}>
                              {isSelected && <CheckCircle size={14} className="text-black" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </HydroTilt>
                  );
                })}
              </div>

              {/* Synergy Result Overlay */}
              <AnimatePresence>
                {synergyMode && selectedSkillIds.length > 1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mt-8 p-6 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-2xl backdrop-blur-xl relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-cyan-300 font-mono font-bold text-sm flex items-center gap-2 mb-1">
                          <Lightbulb size={16} /> SYNERGY ENGINE
                        </h4>
                        <p className="text-xs text-gray-400">Combining {selectedSkillIds.length} vectors...</p>
                      </div>
                      {!synergyResult && (
                        <button 
                          onClick={handleSynergyGenerate}
                          disabled={synthesizing}
                          className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-sm flex items-center gap-2 transition-colors"
                        >
                          {synthesizing ? <Activity size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                          {synthesizing ? "Architecting..." : "Synthesize Solution"}
                        </button>
                      )}
                    </div>

                    {synergyResult && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-black/30 p-4 rounded-xl border border-white/10 text-sm text-gray-200 font-mono leading-relaxed"
                      >
                        {synergyResult}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* WORK SECTION */}
            <section className="relative">
               <div className="flex justify-between items-end mb-4">
                 <div>
                   <h3 className="text-2xl font-bold text-white">Our Portfolio</h3>
                   <p className="text-gray-400 text-sm">Design & Execution Charges: <span className="font-bold text-cyan-400">$45 USD</span></p>
                 </div>
                 <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Swipe to view</span>
               </div>
               <ArcCarousel projects={projects} onSelect={(p) => { setSelectedProject(p); setAnalysis(null); }} playSound={playSound} />
            </section>

            {/* TECH STACK SECTION */}
            <section className="relative py-12">
              <h3 className="text-xl font-bold text-white mb-10 flex items-center gap-2">
                <Cpu size={20} className="text-cyan-500"/> Tech Arsenal
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 perspective-1000">
                {SKILLS_LOGOS.map((skill, idx) => (
                  <HydroTilt key={idx} intensity={0.5}>
                    <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col items-center justify-start gap-3 hover:bg-white/10 transition-all group">
                      <skill.icon size={40} className={`${skill.color} drop-shadow-lg group-hover:scale-110 transition-transform duration-500`} />
                      <span className="text-sm font-bold text-gray-300 tracking-wide group-hover:text-white transition-colors">{skill.name}</span>
                      <p className="text-[11px] text-gray-500 group-hover:text-gray-300 text-center leading-relaxed">
                        {SKILL_DETAILS[skill.name]}
                      </p>
                    </div>
                  </HydroTilt>
                ))}
              </div>
            </section>

            {/* SMART CONTACT FORM (GEMINI POWERED) */}
            <section id="contact" className="max-w-3xl mx-auto pb-10">
              <div className="bg-gradient-to-b from-gray-900 to-black border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden mb-12">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-600" />
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-3xl font-bold mb-2 text-white">Start Your Project</h3>
                    <p className="text-gray-400 text-sm">
                      Consultation is 100% Free. Charges apply only for design & execution.
                    </p>
                  </div>
                  <div className="bg-cyan-900/30 p-2 rounded-lg border border-cyan-500/20">
                    <Sparkles className="text-cyan-400" size={20} />
                  </div>
                </div>
                
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Message Sent!'); playSound('success'); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Name" 
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 focus:border-cyan-500 focus:outline-none transition-colors text-white" 
                    />
                    <input type="email" placeholder="Email" className="bg-white/5 border border-white/10 rounded-lg p-4 focus:border-cyan-500 focus:outline-none transition-colors text-white" />
                  </div>
                  
                  <div className="relative">
                    <textarea 
                      placeholder="Describe your project... (Use the Magic Wand to auto-draft)" 
                      rows={4} 
                      value={contactMsg}
                      onChange={(e) => setContactMsg(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-4 focus:border-cyan-500 focus:outline-none transition-colors text-white pr-12"
                    ></textarea>
                    
                    {/* ✨ GEMINI MAGIC DRAFT BUTTON */}
                    <button 
                      type="button"
                      onClick={handleMagicDraft}
                      disabled={drafting}
                      className="absolute top-3 right-3 p-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 rounded-md transition-colors"
                      title="Auto-Draft with AI"
                    >
                      {drafting ? <Activity size={18} className="animate-spin"/> : <Wand2 size={18} />}
                    </button>
                  </div>

                  <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-4 rounded-lg font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20 transition-all hover:opacity-90">
                    <Send size={16} /> Send Message
                  </button>
                </form>
              </div>

              {/* FOOTER / CONTACT INFO */}
              <div className="border-t border-white/10 pt-10 grid md:grid-cols-2 gap-8 text-sm">
                <div>
                  <h4 className="text-cyan-400 font-bold mb-4 uppercase tracking-widest flex items-center gap-2"><MapPin size={16}/> Headquarters</h4>
                  <p className="text-gray-400 leading-relaxed max-w-xs">
                    {PROFILE.contact.address.split(',').map((line, i) => (
                      <span key={i} className="block">{line.trim()}</span>
                    ))}
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-cyan-400 font-bold mb-2 uppercase tracking-widest flex items-center gap-2"><Phone size={16}/> Direct Line</h4>
                    <p className="text-white font-mono">{PROFILE.contact.phone}</p>
                  </div>
                  <div>
                    <h4 className="text-cyan-400 font-bold mb-2 uppercase tracking-widest flex items-center gap-2"><Mail size={16}/> Electronic Mail</h4>
                    {PROFILE.contact.emails.map((email, i) => (
                      <a key={i} href={`mailto:${email}`} className="block text-gray-400 hover:text-white transition-colors">{email}</a>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-cyan-400 font-bold mb-2 uppercase tracking-widest flex items-center gap-2"><Linkedin size={16}/> Connect</h4>
                    <a href={PROFILE.contact.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
                      {PROFILE.contact.linkedin_handle}
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

      </main>

      {/* PROJECT MODAL */}
      <AnimatePresence>
        {selectedProject && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 w-full h-[90vh] bg-[#0a0a0c] z-[70] rounded-t-[2rem] border-t border-white/10 shadow-2xl overflow-y-auto overflow-x-hidden"
            >
              <div className="sticky top-0 left-0 w-full bg-[#0a0a0c]/90 backdrop-blur-md p-6 z-10 flex justify-between items-center border-b border-white/5">
                <div className="w-12 h-1 bg-gray-700 rounded-full absolute top-3 left-1/2 -translate-x-1/2" />
                <h2 className="text-xl font-bold mt-2 text-white">{selectedProject.title}</h2>
                <button onClick={() => setSelectedProject(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={18} className="text-white"/></button>
              </div>
              <div className="p-6 pb-20">
                <div className="aspect-video w-full rounded-xl overflow-hidden mb-6 relative shadow-lg group">
                   <img src={selectedProject.image} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
                   <div className="absolute bottom-4 right-4 bg-black/70 px-3 py-1 rounded-full text-xs font-mono flex items-center gap-2 border border-white/10 text-white">
                     <Rocket size={12} className="text-cyan-500" /> Live Demo
                   </div>
                </div>
                <div className="mb-8 p-5 rounded-xl bg-cyan-900/20 border border-cyan-500/30">
                  <div className="flex justify-between items-center mb-4">
                     <h4 className="text-cyan-300 font-mono font-bold text-sm flex items-center gap-2">
                       <Cpu size={16} /> DEEP SCAN PROTOCOL
                     </h4>
                     <button 
                       onClick={runProjectAnalysis}
                       disabled={analyzing}
                       className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500 rounded-lg text-xs font-bold text-white flex items-center gap-2 transition-all shadow-sm"
                     >
                       {analyzing ? <Activity size={14} className="animate-spin" /> : <Sparkles size={14} />}
                       {analyzing ? "Scanning..." : "Run Analysis"}
                     </button>
                  </div>
                  {analysis && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-300 font-mono leading-relaxed bg-black/40 p-4 rounded border border-white/10">
                      <span className="text-cyan-400">root@system:~$</span> {analysis}
                    </motion.div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-gray-400 text-xs uppercase block mb-1 font-bold">Cost</span>
                      <span className="font-bold text-white">Project Design: $45</span>
                   </div>
                   <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-gray-400 text-xs uppercase block mb-1 font-bold">Timeline</span>
                      <span className="font-bold text-white">4-6 Weeks</span>
                   </div>
                </div>

                {/* Tech Stack Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-3 text-white">Tech Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(selectedProject.tech) ? (
                      selectedProject.tech.map((t: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-cyan-900/30 border border-cyan-500/30 rounded-full text-xs text-cyan-300 font-mono">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">{selectedProject.tech}</span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-2 text-white">Overview</h3>
                <p className="text-gray-400 leading-relaxed mb-6">{selectedProject.description}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * ADMIN PANEL - ENHANCED DASHBOARD
 */
function AdminPanel({ close, playSound, projects, setProjects, persistProjects, projectsSaving, projectsLoading }: { close: () => void, playSound: Function, projects: any[], setProjects: React.Dispatch<React.SetStateAction<any[]>>, persistProjects: (p:any[])=>Promise<void>, projectsSaving: boolean, projectsLoading: boolean }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', category: '', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b', description: '', tech: '', costSpent: 0, currency: 'USD', demoLink: '', repoLink: '' });
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>(null);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim() === ADMIN_KEY) {
        setIsAuthenticated(true);
        playSound('success');
    } else {
        alert("Invalid Key");
        playSound('click');
    }
  };

  const handleAddProject = () => {
    if (!newProject.title || !newProject.category) return;
    const project = {
      id: `new-${Date.now()}`,
      title: newProject.title,
      category: newProject.category,
      image: newProject.image,
      description: newProject.description,
      tech: newProject.tech.split(',').map(t => t.trim()),
      costSpent: newProject.costSpent || 0,
      currency: newProject.currency || 'USD',
      demoLink: newProject.demoLink.trim(),
      repoLink: newProject.repoLink.trim()
    };
    const next = [project, ...projects];
    persistProjects(next);
    setIsAdding(false);
    setNewProject({ title: '', category: '', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b', description: '', tech: '', costSpent: 0, currency: 'USD', demoLink: '', repoLink: '' });
    playSound('success');
  };
  const startEditProject = (p: any) => {
    setEditingProjectId(p.id);
    setEditingData({ ...p, tech: Array.isArray(p.tech) ? p.tech.join(', ') : p.tech, currency: p.currency || 'USD', demoLink: p.demoLink || '', repoLink: p.repoLink || '' });
  };

  const handleUpdateProject = () => {
    if (!editingProjectId || !editingData) return;
    const next = projects.map(p => p.id === editingProjectId ? {
      ...p,
      title: editingData.title,
      category: editingData.category,
      image: editingData.image,
      description: editingData.description,
      tech: editingData.tech.split(',').map((t: string) => t.trim()),
      costSpent: Number(editingData.costSpent) || 0,
      currency: editingData.currency || 'USD',
      demoLink: editingData.demoLink.trim(),
      repoLink: editingData.repoLink.trim()
    } : p);
    persistProjects(next);
    setEditingProjectId(null);
    setEditingData(null);
    playSound('success');
  };

  const cycleCurrency = (target: 'new' | 'edit') => {
    const order = ['USD','EUR','INR','GBP'];
    if (target === 'new') {
      setNewProject(prev => ({ ...prev, currency: order[(order.indexOf(prev.currency) + 1) % order.length] }));
    } else if (target === 'edit' && editingData) {
      setEditingData((prev: any) => ({ ...prev, currency: order[(order.indexOf(prev.currency) + 1) % order.length] }));
    }
    playSound('click');
  };

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (target === 'new') {
        setNewProject(prev => ({ ...prev, image: reader.result as string }));
      } else if (target === 'edit') {
        setEditingData((prev: any) => ({ ...prev, image: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // All currencies (ISO 4217) via Intl if available, else a sane fallback
  const ALL_CURRENCIES: string[] = (typeof Intl !== 'undefined' && (Intl as any).supportedValuesOf)
    ? (Intl as any).supportedValuesOf('currency')
    : ['USD','EUR','INR','GBP','JPY','CNY','AUD','CAD','CHF','SEK','NZD','AED','SAR','RUB','BRL','ZAR','SGD','HKD'];

  const handleDeleteProject = (id: string) => {
    const next = projects.filter(p => p.id !== id);
    persistProjects(next);
    playSound('click');
  };

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-lg mx-auto bg-[#0f0f12] border border-white/10 rounded-2xl p-10 shadow-xl relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-transparent" />
         <button onClick={close} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
         <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mb-4 text-red-500">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">Restricted Access</h2>
         </div>
         <form onSubmit={handleAuth} className="space-y-4">
           <div className="relative">
             <Key className="absolute left-3 top-3 text-gray-500" size={16} />
             <input 
                type="password" 
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Security Key"
                className="w-full bg-black/50 border border-white/10 rounded p-3 pl-10 text-white focus:border-red-500 outline-none"
             />
           </div>
           <button className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold transition-colors">Verify Identity</button>
         </form>
      </div>
    );
  }

  // DASHBOARD RENDERERS
  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="p-5 bg-cyan-900/10 border border-cyan-500/20 rounded-xl backdrop-blur-sm relative">
            <h3 className="text-cyan-400 text-xs uppercase tracking-widest font-bold flex items-center gap-2"><LayoutDashboard size={14}/> Active Projects</h3>
            <p className="text-3xl font-bold text-white mt-2 flex items-center gap-3">
              {projectsLoading ? <span className="text-sm text-gray-400 font-mono">Loading...</span> : projects.length}
              {projectsSaving && !projectsLoading && <span className="text-[10px] px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30 animate-pulse">Saving...</span>}
            </p>
            <div className="w-full bg-cyan-900/30 h-1 mt-4 rounded-full"><div className="w-[70%] bg-cyan-500 h-full rounded-full" /></div>
            {!projectsLoading && !projectsSaving && <div className="absolute top-3 right-3 text-[10px] text-green-400 font-mono">Synced</div>}
        </div>
        <div className="p-5 bg-purple-900/10 border border-purple-500/20 rounded-xl backdrop-blur-sm">
            <h3 className="text-purple-400 text-xs uppercase tracking-widest font-bold flex items-center gap-2"><Users size={14}/> Clients</h3>
            <p className="text-3xl font-bold text-white mt-2">12</p>
            <div className="w-full bg-purple-900/30 h-1 mt-4 rounded-full"><div className="w-[40%] bg-purple-500 h-full rounded-full" /></div>
        </div>
        <div className="p-5 bg-green-900/10 border border-green-500/20 rounded-xl backdrop-blur-sm">
            <h3 className="text-green-400 text-xs uppercase tracking-widest font-bold flex items-center gap-2"><Activity size={14}/> System Status</h3>
            <p className="text-xl font-bold text-white mt-3 flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Operational</p>
        </div>
    </div>
  );

  const renderProjects = () => {
    if (isAdding) {
      return (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-white flex items-center gap-2"><Plus size={18} className="text-cyan-500"/> New Project Entry</h3>
             <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-white text-xs uppercase tracking-widest">Cancel</button>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl p-6 space-y-5">
             <datalist id="currency-list">
               {ALL_CURRENCIES.map((c) => (<option key={c} value={c} />))}
             </datalist>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  placeholder="Project Title" 
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded p-3 text-white focus:border-cyan-500 outline-none text-sm"
                />
                <input 
                  placeholder="Category (e.g. Web3)" 
                  value={newProject.category}
                  onChange={(e) => setNewProject({...newProject, category: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded p-3 text-white focus:border-cyan-500 outline-none text-sm"
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <input 
                 placeholder="Demo Link (https://...)" 
                 value={newProject.demoLink}
                 onChange={(e) => setNewProject({...newProject, demoLink: e.target.value})}
                 className="bg-black/50 border border-white/10 rounded p-3 text-white focus:border-cyan-500 outline-none text-xs"
               />
               <input 
                 placeholder="Repository Link (https://...)" 
                 value={newProject.repoLink}
                 onChange={(e) => setNewProject({...newProject, repoLink: e.target.value})}
                 className="bg-black/50 border border-white/10 rounded p-3 text-white focus:border-cyan-500 outline-none text-xs"
               />
             </div>
             <input 
                placeholder="Tech Stack (comma separated)" 
                value={newProject.tech}
                onChange={(e) => setNewProject({...newProject, tech: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-cyan-500 outline-none text-sm"
             />
             <textarea 
                placeholder="Project Description" 
                rows={3}
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-cyan-500 outline-none text-sm"
             />
             <div className="grid grid-cols-2 gap-4">
               <div className="flex flex-col gap-2">
                 <div className="flex gap-2">
                   <input 
                     type="number"
                     placeholder={`Spent Cost (${newProject.currency})`}
                     value={newProject.costSpent}
                     onChange={e => setNewProject({...newProject, costSpent: Number(e.target.value)})}
                     className="flex-1 bg-black/50 border border-white/10 rounded p-3 text-white focus:border-cyan-500 outline-none text-sm"
                   />
                   <input
                     type="text"
                     value={newProject.currency}
                     onChange={e => setNewProject({...newProject, currency: e.target.value.toUpperCase()})}
                     list="currency-list"
                     className="w-24 bg-black/50 border border-white/10 rounded p-3 text-white focus:border-cyan-500 outline-none text-xs text-center"
                     placeholder="CUR"
                   />
                   <button type="button" onClick={() => cycleCurrency('new')} className="px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 rounded text-xs font-mono text-cyan-300">↻</button>
                 </div>
                 <div className="text-[10px] text-gray-500">Click currency to cycle (USD/EUR/INR/GBP)</div>
               </div>
               <div className="flex flex-col gap-2">
                 <input 
                   type="file" 
                   accept="image/*" 
                   onChange={e => handleImageInput(e,'new')} 
                   className="text-xs text-gray-300" />
                 <div className="text-[10px] uppercase tracking-widest text-gray-500">Preview</div>
                 <img src={newProject.image} alt="preview" className="w-full h-32 object-cover rounded border border-white/10" />
               </div>
             </div>
             <button onClick={handleAddProject} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg font-bold transition-colors">
               Deploy Project
             </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Portfolio Index</h3>
              <button onClick={() => setIsAdding(true)} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
                  <Upload size={14} /> Add New
              </button>
          </div>
          {editingProjectId && editingData && (
            <div className="bg-white/5 border border-cyan-500/30 rounded-xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-2"><Settings size={14}/> Edit Project</h4>
              <datalist id="currency-list-edit">
                {ALL_CURRENCIES.map((c) => (<option key={c} value={c} />))}
              </datalist>
              <div className="grid grid-cols-2 gap-4">
                <input value={editingData.title} onChange={e => setEditingData({...editingData, title: e.target.value})} placeholder="Title" className="bg-black/50 border border-white/10 rounded p-3 text-white text-sm" />
                <input value={editingData.category} onChange={e => setEditingData({...editingData, category: e.target.value})} placeholder="Category" className="bg-black/50 border border-white/10 rounded p-3 text-white text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input value={editingData.demoLink} onChange={e => setEditingData({...editingData, demoLink: e.target.value})} placeholder="Demo Link" className="bg-black/50 border border-white/10 rounded p-3 text-white text-xs" />
                <input value={editingData.repoLink} onChange={e => setEditingData({...editingData, repoLink: e.target.value})} placeholder="Repo Link" className="bg-black/50 border border-white/10 rounded p-3 text-white text-xs" />
              </div>
              <input value={editingData.tech} onChange={e => setEditingData({...editingData, tech: e.target.value})} placeholder="Tech (comma)" className="bg-black/50 border border-white/10 rounded p-3 text-white text-sm w-full" />
              <textarea value={editingData.description} onChange={e => setEditingData({...editingData, description: e.target.value})} placeholder="Description" rows={3} className="bg-black/50 border border-white/10 rounded p-3 text-white text-sm w-full" />
                <div className="flex items-center gap-4">
                <div className="flex-1">
                    <div className="flex gap-2">
                      <input type="number" value={editingData.costSpent} onChange={e => setEditingData({...editingData, costSpent: e.target.value})} placeholder={`Spent Cost (${editingData.currency})`} className="flex-1 bg-black/50 border border-white/10 rounded p-3 text-white text-sm" />
                      <input
                        type="text"
                        value={editingData.currency}
                        onChange={e => setEditingData({...editingData, currency: e.target.value.toUpperCase()})}
                        list="currency-list-edit"
                        className="w-24 bg-black/50 border border-white/10 rounded p-3 text-white focus:border-cyan-500 outline-none text-xs text-center"
                        placeholder="CUR"
                      />
                      <button type="button" onClick={() => cycleCurrency('edit')} className="px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 rounded text-xs font-mono text-cyan-300">↻</button>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">Cycle currency (USD/EUR/INR/GBP)</div>
                </div>
                <div className="flex flex-col items-start gap-2">
                  <input type="file" accept="image/*" onChange={e => handleImageInput(e, 'edit')} className="text-xs" />
                  {editingData.image && <img src={editingData.image} alt="preview" className="w-16 h-16 object-cover rounded border border-white/10" />}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleUpdateProject} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold">Update Project</button>
                <button onClick={() => { setEditingProjectId(null); setEditingData(null); }} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-bold">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
              {projects.map(p => (
                  <div key={p.id} className="p-3 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center hover:border-cyan-500/30 transition-colors group">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-gray-800 overflow-hidden relative">
                              <img src={p.image} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt={p.title} />
                          </div>
                          <div>
                              <h4 className="font-bold text-white text-sm">{p.title}</h4>
                              <span className="text-[10px] text-gray-400 uppercase">{p.category}</span>
                               <div className="text-[10px] text-cyan-400 font-mono mt-1">Spent: {p.currency || 'USD'} {p.costSpent}</div>
                          </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditProject(p)} className="p-1.5 hover:bg-white/10 rounded text-cyan-400"><Settings size={14} /></button>
                          <button onClick={() => handleDeleteProject(p.id)} className="p-1.5 hover:bg-red-500/20 rounded text-red-400"><Trash2 size={14} /></button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-4 animate-in fade-in">
        <div className="p-4 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
            <div>
                <h4 className="text-white font-bold text-sm">Accepting Projects</h4>
                <p className="text-xs text-gray-400">Toggle public availability status</p>
            </div>
            <div className="w-10 h-5 bg-green-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" /></div>
        </div>
        <div className="p-4 bg-white/5 rounded-lg border border-white/5">
            <h4 className="text-white font-bold text-sm mb-2">Consultation Fee</h4>
            <div className="flex gap-2">
                <input type="text" defaultValue="Free" className="bg-black/50 border border-white/10 rounded p-2 text-sm text-white w-full" />
                <button className="px-4 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-bold">Update</button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="w-full bg-[#0f0f12] border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row h-[500px]">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-black/20 border-r border-white/5 p-4 flex flex-col">
         <div className="mb-8 px-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings className="text-cyan-500" size={18}/> Admin</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Control Panel</p>
         </div>
         <div className="space-y-1 flex-1">
            {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'projects', label: 'Projects', icon: Layers },
                { id: 'inbox', label: 'Inbox', icon: Mail },
                { id: 'settings', label: 'Settings', icon: Settings },
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setIsAdding(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <tab.icon size={16} /> {tab.label}
                </button>
            ))}
         </div>
         <button onClick={close} className="mt-auto flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors">
            <LogOut size={16} /> Logout
         </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 md:p-8 bg-[#0a0a0c] relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-600 opacity-50" />
         
         {/* Top Bar */}
         <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white capitalize">{activeTab}</h2>
            <div className="flex gap-3">
                <button className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white"><Bell size={16} /></button>
            </div>
         </div>

         {/* Views */}
         <div className="h-full overflow-y-auto pb-10">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'projects' && renderProjects()}
            {activeTab === 'settings' && renderSettings()}
            {activeTab === 'inbox' && (
                <div className="text-center py-20 text-gray-500">
                    <Mail size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No new messages in secure channel.</p>
                </div>
            )}
         </div>
      </div>
    </div>
  );
}

function SocialBtn({ icon: Icon, href }: { icon: any, href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500 hover:bg-cyan-500 hover:text-white text-gray-400 transition-all shadow-sm">
      <Icon size={20} />
    </a>
  );
}