"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  Compass,
  FileCheck,
  Search,
  Target,
  CheckCircle2,
  Shield,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  Loader2,
  X,
  KeyRound,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  sendOtp,
  verifyOtp,
} from "@/app/actions/auth";
import { toast } from "sonner";

const trustLabels = [
  { icon: Shield, text: "Official Government Sources" },
  { icon: Target, text: "Personalized Eligibility" },
  { icon: Search, text: "Live Opportunity Discovery" },
  { icon: FileCheck, text: "Clear Next Steps" },
];

const previewCards = [
  {
    status: "Eligible Now",
    statusColor: "text-growth-teal",
    bgColor: "bg-growth-teal/5",
    borderColor: "border-growth-teal/20",
    count: "12",
  },
  {
    status: "Gap-Eligible",
    statusColor: "text-seal-gold",
    bgColor: "bg-seal-gold/5",
    borderColor: "border-seal-gold/20",
    count: "5",
  },
  {
    status: "Future-Eligible",
    statusColor: "text-horizon-slate",
    bgColor: "bg-horizon-slate/5",
    borderColor: "border-horizon-slate/20",
    count: "8",
  },
  {
    status: "Profile Completion",
    statusColor: "text-ink",
    bgColor: "bg-ink/5",
    borderColor: "border-ink/10",
    count: "85%",
  },
];

/* ─── 3D Staircase Visual ─── */
function StaircaseVisual({ mousePos }: { mousePos: { x: number; y: number } }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Compass / Orbit glow */}
      <div
        className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(192,138,40,0.3) 0%, rgba(47,111,94,0.1) 50%, transparent 70%)",
          transform: `translate(${mousePos.x * 8}px, ${mousePos.y * 8}px)`,
          transition: "transform 0.3s ease-out",
        }}
      />

      {/* Orbit ring */}
      <div
        className="absolute w-48 h-48 md:w-64 md:h-64 border border-seal-gold/15 rounded-full animate-spin-slow"
        style={{
          transform: `translate(${mousePos.x * 4}px, ${mousePos.y * 4}px) rotateX(60deg)`,
          transition: "transform 0.3s ease-out",
        }}
      />
      <div
        className="absolute w-32 h-32 md:w-44 md:h-44 border border-growth-teal/10 rounded-full animate-reverse-spin"
        style={{
          transform: `translate(${mousePos.x * 6}px, ${mousePos.y * 6}px) rotateX(60deg)`,
          transition: "transform 0.3s ease-out",
        }}
      />

      {/* Staircase steps */}
      <div className="relative z-10 flex items-end gap-3 md:gap-4">
        {[
          {
            h: "h-14 md:h-20",
            label: "Eligible Now",
            color: "bg-growth-teal",
            depth: 2,
          },
          {
            h: "h-20 md:h-28",
            label: "Gap-Eligible",
            color: "bg-seal-gold",
            depth: 4,
          },
          {
            h: "h-28 md:h-36",
            label: "Future-Eligible",
            color: "bg-ink",
            depth: 6,
          },
        ].map((step, i) => (
          <div
            key={step.label}
            className="flex flex-col items-center gap-2"
            style={{
              transform: `translateY(${mousePos.y * step.depth * -0.5}px) translateX(${mousePos.x * step.depth * 0.3}px)`,
              transition: "transform 0.3s ease-out",
            }}
          >
            {/* Floating card above step */}
            <div
              className={`w-16 h-10 md:w-20 md:h-12 ${step.color}/10 border ${step.color}/30 rounded-md flex items-center justify-center backdrop-blur-sm`}
              style={{
                animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            >
              <span
                className={`font-mono text-[8px] md:text-[10px] ${step.color} font-bold uppercase tracking-wider`}
              >
                {step.label}
              </span>
            </div>

            {/* Step block */}
            <div
              className={`w-16 md:w-20 ${step.h} ${step.color}/80 rounded-sm border ${step.color} relative overflow-hidden`}
              style={{
                boxShadow: `0 8px 32px ${step.color}20, 0 2px 8px ${step.color}10`,
              }}
            >
              {/* Glass surface */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20" />
              {/* Step number */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                <span className="font-mono text-[10px] md:text-xs text-white/60 font-bold">
                  0{i + 1}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating orbit particles */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-seal-gold/30 animate-float-particle"
          style={{
            top: `${20 + i * 15}%`,
            left: `${10 + i * 20}%`,
            animationDelay: `${i * 0.8}s`,
            transform: `translate(${mousePos.x * (i + 1) * 0.5}px, ${mousePos.y * (i + 1) * 0.5}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
      ))}

      {/* Compass icon floating */}
      <div
        className="absolute top-6 right-8 md:top-8 md:right-12 text-seal-gold/40"
        style={{
          transform: `translate(${mousePos.x * 3}px, ${mousePos.y * 3}px)`,
          transition: "transform 0.3s ease-out",
        }}
      >
        <Compass className="w-6 h-6 md:w-8 md:h-8 animate-spin-slow" />
      </div>
    </div>
  );
}

/* ─── Auth Modal ─── */
function AuthModal({
  isOpen,
  onClose,
  initialMode,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialMode: "signin" | "signup";
}) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"google-phone" | "email">(
    "google-phone"
  );

  // Phone OTP
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpToken, setOtpToken] = useState("");

  // Email
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const resetState = () => {
    setAuthMethod("google-phone");
    setPhone("");
    setOtpSent(false);
    setOtpToken("");
    setEmail("");
    setPassword("");
    setName("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log("[Auth Modal] Starting Google sign-in...");
      const res = await signInWithGoogle("/");
      console.log("[Auth Modal] Google sign-in response:", res);
      if (res.error) {
        toast.error(res.error);
      } else if (res.url) {
        console.log("[Auth Modal] Redirecting to:", res.url);
        window.location.href = res.url;
      } else {
        toast.error("No redirect URL received from Google");
      }
    } catch (err) {
      console.error("[Auth Modal] Google sign-in exception:", err);
      toast.error("Google Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Please enter a phone number");
      return;
    }
    setLoading(true);
    try {
      console.log("[Auth Modal] Sending OTP to:", phone);
      const res = await sendOtp(phone);
      console.log("[Auth Modal] Send OTP response:", res);
      if (res.error) {
        toast.error(res.error);
      } else {
        setOtpSent(true);
        toast.success("OTP sent! Check your phone.");
      }
    } catch (err) {
      console.error("[Auth Modal] Send OTP exception:", err);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken.trim()) {
      toast.error("Please enter the OTP code");
      return;
    }
    setLoading(true);
    try {
      console.log("[Auth Modal] Verifying OTP for:", phone);
      const res = await verifyOtp(phone, otpToken);
      console.log("[Auth Modal] Verify OTP response:", res);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Signed in successfully!");
        window.location.href = "/";
      }
    } catch (err) {
      console.error("[Auth Modal] Verify OTP exception:", err);
      toast.error("OTP Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      if (mode === "signup") {
        formData.append("name", name || "User");
        const res = await signUpWithEmail(formData);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Account created! Check your email to verify.");
          setMode("signin");
        }
      } else {
        const res = await signInWithEmail(formData);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Signed in successfully!");
          window.location.href = "/";
        }
      }
    } catch {
      toast.error("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-paper border border-ink/15 rounded-lg shadow-2xl overflow-hidden animate-modal-in">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-ink/5 transition-colors"
        >
          <X className="w-4 h-4 text-ink/60" />
        </button>

        {/* Top decorative bar */}
        <div className="h-1 bg-gradient-to-r from-growth-teal via-seal-gold to-ink" />

        <div className="p-8">
          {/* Brand */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-seal-gold/10 border border-seal-gold rounded-full flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-seal-gold" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-ink tracking-tight">
                {mode === "signin" ? "Welcome back" : "Join Margdarshak"}
              </h2>
              <p className="text-[11px] font-sans text-horizon-slate">
                {mode === "signin"
                  ? "Sign in to see opportunities matched to your journey."
                  : "Create your account to discover government opportunities."}
              </p>
            </div>
          </div>

          {authMethod === "google-phone" ? (
            <div className="space-y-4">
              {/* Google */}
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-ink hover:bg-ink/90 text-white rounded-md h-11 flex items-center justify-center gap-2.5 font-sans text-sm font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.186 4.114-3.578 0-6.48-2.903-6.48-6.48s2.902-6.48 6.48-6.48c1.635 0 3.13.6 4.29 1.587l3.093-3.093C19.128 2.185 15.89 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.899 0 10.9-4.22 10.9-11.24 0-.668-.09-1.26-.24-1.954H12.24z" />
                  </svg>
                )}
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-ink/10" />
                <span className="flex-shrink mx-3 text-[10px] font-mono uppercase text-ink/30 tracking-wider">
                  or
                </span>
                <div className="flex-grow border-t border-ink/10" />
              </div>

              {/* Phone + OTP */}
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="modal-phone"
                      className="text-xs font-sans text-ink/70"
                    >
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                      <Input
                        id="modal-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={loading}
                        className="pl-10 bg-background border-ink/15 rounded-md h-10 text-sm font-mono focus-visible:ring-seal-gold"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-seal-gold hover:bg-seal-gold/90 text-white rounded-md h-10 font-sans font-semibold text-sm"
                  >
                    {loading && (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    )}
                    Send OTP
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="modal-otp"
                      className="text-xs font-sans text-ink/70"
                    >
                      Enter 6-digit OTP sent to {phone}
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                      <Input
                        id="modal-otp"
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value)}
                        disabled={loading}
                        className="pl-10 bg-background border-ink/15 rounded-md h-10 text-sm font-mono tracking-widest focus-visible:ring-seal-gold"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOtpSent(false)}
                      disabled={loading}
                      className="flex-1 border-ink/15 rounded-md font-sans text-sm"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-seal-gold hover:bg-seal-gold/90 text-white rounded-md font-sans font-semibold text-sm"
                    >
                      {loading && (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      )}
                      Verify & Sign In
                    </Button>
                  </div>
                </form>
              )}

              {/* Switch to email */}
              <button
                onClick={() => setAuthMethod("email")}
                className="w-full text-center text-xs font-sans text-horizon-slate hover:text-ink transition-colors flex items-center justify-center gap-1 pt-1"
              >
                <Mail className="w-3.5 h-3.5" />
                Use email + password instead
              </button>
            </div>
          ) : (
            /* Email form */
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans text-ink/70">
                    Full Name
                  </Label>
                  <Input
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="bg-background border-ink/15 rounded-md h-10 text-sm focus-visible:ring-seal-gold"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-sans text-ink/70">
                  Email Address
                </Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-background border-ink/15 rounded-md h-10 text-sm focus-visible:ring-seal-gold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans text-ink/70">
                  Password
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-background border-ink/15 rounded-md h-10 text-sm focus-visible:ring-seal-gold"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-ink hover:bg-ink/90 text-white rounded-md h-10 font-sans font-semibold text-sm"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                {mode === "signin" ? "Sign In" : "Create Account"}
              </Button>

              <button
                type="button"
                onClick={() => setAuthMethod("google-phone")}
                className="w-full text-center text-xs font-sans text-horizon-slate hover:text-ink transition-colors flex items-center justify-center gap-1 pt-1"
              >
                <Phone className="w-3.5 h-3.5" />
                Go back to Google & Phone Login
              </button>
            </form>
          )}

          {/* Mode toggle */}
          <div className="text-center mt-5 pt-4 border-t border-ink/10">
            {mode === "signin" ? (
              <p className="text-xs text-horizon-slate font-sans">
                New here?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    resetState();
                  }}
                  className="text-seal-gold font-bold hover:underline"
                >
                  Get started
                </button>
              </p>
            ) : (
              <p className="text-xs text-horizon-slate font-sans">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signin");
                    resetState();
                  }}
                  className="text-seal-gold font-bold hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Landing Page ─── */
export default function ClientLandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const heroRef = useRef<HTMLDivElement>(null);

  // Mouse parallax (desktop only)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  }, []);

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) {
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }
  }, [handleMouseMove]);

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans">
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-40 bg-paper/80 backdrop-blur-md border-b border-ink/8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-seal-gold/10 border border-seal-gold rounded-full flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-seal-gold" />
            </div>
            <div>
              <span className="font-heading text-base font-bold text-ink tracking-tight block leading-tight">
                Margdarshak
              </span>
              <span className="text-[8px] font-mono text-horizon-slate uppercase tracking-widest hidden sm:block">
                Govt Opportunity Navigator
              </span>
            </div>
          </Link>

          {/* Nav Links (desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#how-it-works"
              className="text-xs font-sans font-medium text-horizon-slate hover:text-ink transition-colors"
            >
              How It Works
            </a>
            <a
              href="#opportunities"
              className="text-xs font-sans font-medium text-horizon-slate hover:text-ink transition-colors"
            >
              Opportunities
            </a>
            <a
              href="#about"
              className="text-xs font-sans font-medium text-horizon-slate hover:text-ink transition-colors"
            >
              About
            </a>
            <button
              onClick={() => openAuth("signin")}
              className="text-xs font-sans font-medium text-ink hover:text-seal-gold transition-colors"
            >
              Sign In
            </button>
            <Button
              onClick={() => openAuth("signup")}
              className="bg-ink hover:bg-ink/90 text-white rounded-md text-xs font-semibold h-8 px-4"
            >
              Get Started
            </Button>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => openAuth("signup")}
            className="md:hidden bg-ink hover:bg-ink/90 text-white rounded-md text-xs font-semibold h-8 px-3"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section
        ref={heroRef}
        className="relative min-h-[90vh] md:min-h-screen flex items-center overflow-hidden"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-paper via-paper to-growth-teal/5" />

        <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-0 w-full">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Copy */}
            <div className="space-y-6 md:space-y-8 z-10">
              <div className="space-y-4">
                <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-ink leading-[1.05]">
                  Your next
                  <br />
                  opportunity is
                  <br />
                  <span className="text-growth-teal">closer than</span>
                  <br />
                  you think.
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-horizon-slate font-sans leading-relaxed max-w-md">
                  Scholarships, fellowships and internships matched to your
                  journey — with clear eligibility, official sources, and the
                  next step explained.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => openAuth("signup")}
                  className="bg-growth-teal hover:bg-growth-teal/90 text-white rounded-md h-11 px-6 font-sans font-semibold text-sm flex items-center gap-2 group transition-all"
                >
                  Find My Opportunities
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <a href="#how-it-works">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-ink/20 hover:bg-ink/5 rounded-md h-11 px-6 font-sans font-semibold text-sm text-ink flex items-center gap-2 transition-all"
                  >
                    Explore How It Works
                    <Compass className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Right: 3D Visual */}
            <div className="relative h-72 sm:h-80 md:h-[480px] lg:h-[520px]">
              <StaircaseVisual mousePos={mousePos} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Strip ─── */}
      <section className="border-y border-ink/8 bg-paper py-8 md:py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <p className="text-center text-xs sm:text-sm text-horizon-slate font-sans mb-6">
            Built to help students navigate India&apos;s scattered opportunity
            system.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {trustLabels.map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-2.5 justify-center md:justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-growth-teal/8 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-growth-teal" />
                </div>
                <span className="text-xs font-sans font-medium text-ink/70">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section
        id="how-it-works"
        className="py-16 md:py-24 bg-gradient-to-b from-paper to-background"
      >
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12 md:mb-16">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-seal-gold font-semibold block mb-3">
              Process
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink tracking-tight">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                num: "01",
                icon: Target,
                title: "Tell us about yourself",
                desc: "Share your stage, marks, category and state.",
                iconBg: "bg-growth-teal/10",
                iconBorder: "border-growth-teal/20",
                iconColor: "text-growth-teal",
              },
              {
                num: "02",
                icon: Search,
                title: "We find relevant opportunities",
                desc: "Margdarshak searches verified government sources and matches opportunities to your profile.",
                iconBg: "bg-seal-gold/10",
                iconBorder: "border-seal-gold/20",
                iconColor: "text-seal-gold",
              },
              {
                num: "03",
                icon: CheckCircle2,
                title: "Know exactly what to do next",
                desc: "See whether you're eligible, what you're missing, and which opportunities to pursue.",
                iconBg: "bg-ink/10",
                iconBorder: "border-ink/20",
                iconColor: "text-ink",
              },
            ].map((step, i) => (
              <div key={step.num} className="relative group">
                {/* Staircase connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-ink/10 to-ink/5 -z-0">
                    <ChevronRight className="absolute -right-2 -top-2 w-4 h-4 text-ink/15" />
                  </div>
                )}

                <div className="relative bg-paper border border-ink/10 rounded-lg p-6 md:p-8 hover:border-ink/20 transition-all hover:shadow-lg group-hover:shadow-ink/5">
                  {/* Step number */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-lg ${step.iconBg} border ${step.iconBorder} flex items-center justify-center`}
                    >
                      <step.icon className={`w-5 h-5 ${step.iconColor}`} />
                    </div>
                    <span className="font-mono text-xs text-ink/30 font-bold">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="font-heading text-lg font-bold text-ink mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-horizon-slate font-sans leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Preview ─── */}
      <section
        id="opportunities"
        className="py-16 md:py-24 bg-background"
      >
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-seal-gold font-semibold block mb-3">
              Inside Margdarshak
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink tracking-tight mb-3">
              Your Dashboard Preview
            </h2>
            <p className="text-sm text-horizon-slate font-sans">
              A glimpse of what you&apos;ll see after signing in.
            </p>
          </div>

          {/* Dashboard preview mock */}
          <div className="relative">
            {/* Browser chrome */}
            <div className="bg-ink/5 border border-ink/10 rounded-t-lg px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-stamp-red/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-seal-gold/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-growth-teal/40" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-paper border border-ink/10 rounded-md h-6 flex items-center px-3 max-w-md mx-auto">
                  <span className="font-mono text-[9px] text-ink/30">
                    margdarshak.app/dashboard
                  </span>
                </div>
              </div>
            </div>

            {/* Preview content */}
            <div className="bg-paper border border-t-0 border-ink/10 rounded-b-lg p-6 md:p-8 space-y-6">
              {/* Preview label */}
              <div className="flex items-center gap-2 pb-3 border-b border-ink/5">
                <Sparkles className="w-3.5 h-3.5 text-seal-gold" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-seal-gold font-semibold">
                  Product Preview
                </span>
              </div>

              {/* Welcome mock */}
              <div>
                <h3 className="font-heading text-2xl font-bold text-ink">
                  Namaste, Student
                </h3>
                <p className="text-xs text-horizon-slate font-sans mt-1">
                  Here is your personalized education opportunities dashboard.
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {previewCards.map((card) => (
                  <div
                    key={card.status}
                    className={`${card.bgColor} border ${card.borderColor} rounded-md p-4`}
                  >
                    <span className="font-mono text-[9px] uppercase tracking-wider text-ink/40 block">
                      {card.status}
                    </span>
                    <span
                      className={`font-mono text-2xl font-bold ${card.statusColor} block mt-1`}
                    >
                      {card.count}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mock opportunity card */}
              <div className="border border-ink/10 rounded-md p-4 space-y-3 opacity-80">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-growth-teal animate-pulse" />
                  <span className="font-mono text-[9px] text-growth-teal uppercase font-bold tracking-wider">
                    Eligible Now
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="h-3 bg-ink/8 rounded w-3/4" />
                  <div className="h-2.5 bg-ink/5 rounded w-1/2" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-growth-teal/10 rounded-sm w-20" />
                  <div className="h-6 bg-ink/5 rounded-sm w-16" />
                </div>
              </div>

              {/* CTA overlay */}
              <div className="text-center pt-2">
                <Button
                  onClick={() => openAuth("signup")}
                  className="bg-growth-teal hover:bg-growth-teal/90 text-white rounded-md h-10 px-6 font-sans font-semibold text-sm"
                >
                  Get Started — It&apos;s Free
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer / About ─── */}
      <footer
        id="about"
        className="border-t border-ink/8 bg-paper py-12 md:py-16"
      >
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-seal-gold" />
                <span className="font-heading text-base font-bold text-ink">
                  Margdarshak
                </span>
              </div>
              <p className="text-xs text-horizon-slate font-sans leading-relaxed max-w-xs">
                A personalized navigator for Indian students to discover
                scholarships, fellowships, internships, and government
                opportunities.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-sans text-xs font-bold text-ink uppercase tracking-wider">
                Product
              </h4>
              <div className="space-y-2">
                <a
                  href="#how-it-works"
                  className="block text-xs text-horizon-slate hover:text-ink transition-colors font-sans"
                >
                  How It Works
                </a>
                <a
                  href="#opportunities"
                  className="block text-xs text-horizon-slate hover:text-ink transition-colors font-sans"
                >
                  Features
                </a>
                <button
                  onClick={() => openAuth("signup")}
                  className="block text-xs text-horizon-slate hover:text-ink transition-colors font-sans text-left"
                >
                  Get Started
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-sans text-xs font-bold text-ink uppercase tracking-wider">
                Account
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => openAuth("signin")}
                  className="block text-xs text-horizon-slate hover:text-ink transition-colors font-sans text-left"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="block text-xs text-horizon-slate hover:text-ink transition-colors font-sans text-left"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-ink/8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-mono text-[10px] text-ink/30 uppercase tracking-wider">
              © 2025 Margdarshak
            </span>
            <span className="font-mono text-[9px] text-ink/20 uppercase tracking-wider">
              Govt Opportunity Navigator
            </span>
          </div>
        </div>
      </footer>

      {/* ─── Auth Modal ─── */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}
