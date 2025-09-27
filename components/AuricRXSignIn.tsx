"use client";

import { useState } from "react";
import { motion } from "framer-motion";

/**
 * Auric RX — Black & Gold premium sign-in screen
 * - Animated top "slit light" beaming over the AR logo
 * - Sign in + Sign up CTAs, Apple/Google SSO
 * - Replace <ARMonogram/> with your real logo when ready
 */
export default function AuricRXSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email, password });
  };

  return (
    <div className="min-h-screen bg-black text-neutral-200 relative overflow-hidden">
      {/* Ambient vignette & corner glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-yellow-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,215,128,0.06),rgba(0,0,0,0.8))]" />
      </div>

      {/* Animated Top Slit Light */}
      <AnimatedTopBeam />

      <main className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
            {/* Header */}
            <div className="px-8 pt-12 pb-4 text-center">
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-amber-300/30 to-yellow-600/30 ring-1 ring-amber-400/30 shadow-[0_0_50px_2px_rgba(251,191,36,0.25)]"
              >
                <ARMonogram />
              </motion.div>
              <h1 className="text-3xl font-semibold tracking-tight leading-none">
                <span className="bg-gradient-to-b from-yellow-200 to-amber-400 bg-clip-text text-transparent">
                  AURIC
                </span>{" "}
                <span className="bg-gradient-to-b from-yellow-300 to-amber-500 bg-clip-text text-transparent">
                  RX
                </span>
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-10">
              <label htmlFor="email" className="mb-2 block text-sm text-neutral-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@domain.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-4 w-full rounded-xl bg-black/40 px-4 py-3 text-sm outline-none ring-1 ring-white/10 placeholder:text-neutral-500 focus:ring-2 focus:ring-amber-400/60"
              />

              <label htmlFor="password" className="mb-2 block text-sm text-neutral-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mb-5 w-full rounded-xl bg-black/40 px-4 py-3 text-sm outline-none ring-1 ring-white/10 placeholder:text-neutral-500 focus:ring-2 focus:ring-amber-400/60"
              />

              {/* Primary CTA */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                type="submit"
                className="group relative mb-4 w-full rounded-xl px-4 py-3 text-sm font-medium text-black"
              >
                <span className="absolute inset-0 rounded-xl bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500" />
                <span className="absolute inset-[1px] rounded-[0.70rem] bg-gradient-to-b from-yellow-100/80 to-amber-100/50 opacity-10" />
                <span className="relative">Sign in</span>
              </motion.button>

              {/* Sign up (outline gold) */}
              <button
                type="button"
                onClick={() => (window.location.href = "/sign-up")}
                className="relative mb-6 w-full rounded-xl px-4 py-3 text-sm font-medium text-amber-300 border border-amber-300/60 hover:bg-amber-50/5"
              >
                Sign up
              </button>

              {/* SSO */}
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm hover:bg-white/5"
                >
                  <span className="text-lg">🍎</span> Continue with Apple
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm hover:bg-white/5"
                >
                  <span className="text-lg">G</span> Continue with Google
                </button>
              </div>

              {/* Legal */}
              <p className="mt-5 text-center text-xs text-neutral-500">
                By signing in, you agree to our{" "}
                <a className="text-neutral-300 underline-offset-4 hover:underline" href="#">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a className="text-neutral-300 underline-offset-4 hover:underline" href="#">
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

/** Animated top beam: slit + pulse + sweep */
function AnimatedTopBeam() {
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 h-48">
      {/* narrow slit */}
      <div
        className="absolute left-1/2 top-2 h-[2px] w-[86%] -translate-x-1/2 rounded-full"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,245,220,.9) 50%, rgba(255,255,255,0) 100%)",
          filter:
            "drop-shadow(0 0 10px rgba(255,220,140,.8)) drop-shadow(0 0 35px rgba(255,210,120,.45))",
          backgroundSize: "200% 100%",
          animation: "slitSheen 3.2s ease-in-out infinite",
        }}
      />
      {/* downward luminous beam */}
      <div
        className="absolute inset-x-0 top-0 h-full"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 0%, rgba(255,208,128,.32) 0%, rgba(255,208,128,.16) 35%, rgba(0,0,0,0) 70%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,.7) 40%, transparent 85%)",
          maskImage:
            "linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,.7) 40%, transparent 85%)",
          animation: "beamPulse 2.8s ease-in-out infinite",
        }}
      />
      {/* sweeping sparkle */}
      <div
        className="absolute top-1 left-1/2 h-10 w-28 -translate-x-1/2"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,243,210,.9), rgba(255,255,255,0))",
          filter: "blur(6px)",
          animation: "beamSweep 2.4s ease-in-out infinite alternate",
        }}
      />
    </div>
  );
}

/** Placeholder AR monogram; replace with your SVG logo */
function ARMonogram() {
  return (
    <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden>
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <g fill="url(#g)" stroke="url(#g)">
        <text x="6" y="40" fontSize="30" fontWeight="600" letterSpacing="1">
          A
        </text>
        <text x="28" y="40" fontSize="30" fontWeight="600" letterSpacing="1">
          R
        </text>
        <rect x="18" y="26" width="20" height="10" rx="5" fill="none" strokeWidth="1.5" />
        <line x1="28" y1="26" x2="28" y2="36" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
