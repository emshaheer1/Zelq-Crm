"use client";

import { useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { LoginForm } from "./login-form";

const steps = [
  { n: "01", title: "Plan the work", body: "Projects, scope, and owners in one place." },
  { n: "02", title: "Track progress", body: "Tasks, deadlines, and status as they move." },
  { n: "03", title: "Deliver together", body: "Ship client work and keep the team aligned." },
];

function BrandMotion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const nodes = Array.from({ length: 36 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00035,
      vy: (Math.random() - 0.5) * 0.00035,
    }));

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
      }
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = (nodes[i].x - nodes[j].x) * w;
          const dy = (nodes[i].y - nodes[j].y) * h;
          const d = Math.hypot(dx, dy);
          if (d < 120) {
            ctx.globalAlpha = 1 - d / 120;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x * w, nodes[i].y * h);
            ctx.lineTo(nodes[j].x * w, nodes[j].y * h);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x * w, n.y * h, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 size-full" aria-hidden />;
}

export function LoginScreen() {
  return (
    <div className="grid h-dvh overflow-hidden bg-white lg:grid-cols-2">
      <section className="relative hidden h-dvh flex-col overflow-hidden bg-[#0f1115] px-12 py-10 text-white lg:flex">
        <div className="login-grid pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden />
        <div className="login-scan pointer-events-none absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-white/10 to-transparent" aria-hidden />
        <BrandMotion />

        <img
          src="/logo-full.png"
          alt="ZelQ Solutions"
          className="relative z-10 h-16 w-auto max-w-[240px] object-contain object-left mix-blend-screen"
        />

        <div className="relative z-10 mt-14 max-w-[430px]">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-[#b4f216]">FROM BRIEF TO DELIVERY</p>
          <h1 className="mt-4 font-[family-name:var(--font-poppins)] text-[44px] leading-[1.04] font-semibold tracking-[-0.03em] xl:text-[52px]">
            Run every client
            <br />
            project from one
            <br />
            workspace.
          </h1>
          <p className="mt-5 max-w-[360px] text-[14px] leading-relaxed text-white/55">
            ZelQ CRM keeps projects, tasks, deadlines, and your team in one place — from kickoff to launch.
          </p>
        </div>

        <ol className="relative z-10 mt-10 space-y-4">
          {steps.map((step) => (
            <li key={step.n} className="flex items-start gap-3.5">
              <span className="mt-0.5 grid size-[30px] shrink-0 place-items-center rounded-full bg-[#b4f216] text-[10px] font-semibold text-[#111111]">
                {step.n}
              </span>
              <div>
                <p className="text-[14px] font-medium text-white">{step.title}</p>
                <p className="mt-0.5 text-[12.5px] text-white/40">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="relative z-10 mt-auto text-[12.5px] text-white/45">
          © 2026 ZelQ Solutions. All rights reserved.
        </p>
      </section>

      <section className="flex h-dvh items-center justify-center overflow-hidden px-8 sm:px-14">
        <div className="w-full max-w-[400px]">
          <p className="text-[11px] font-semibold tracking-[0.26em] text-[#111111]">WELCOME BACK</p>
          <h2 className="mt-3 font-[family-name:var(--font-poppins)] text-[32px] font-semibold tracking-tight text-[#101828]">Sign in to ZelQ CRM</h2>
          <p className="mt-2 text-[14px] text-[#6b7280]">Use your ZelQ account to continue.</p>
          <LoginForm />
          <p className="mt-8 flex items-center gap-2 text-[12px] text-[#9ca3af]">
            <Lock className="size-3.5" aria-hidden />
            Encrypted team session
          </p>
        </div>
      </section>
    </div>
  );
}
