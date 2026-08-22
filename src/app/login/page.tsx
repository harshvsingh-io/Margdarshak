"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  sendOtp,
  verifyOtp,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  GraduationCap,
  KeyRound,
  Phone,
  Mail,
  Loader2,
  Compass,
  ArrowRight,
} from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || "/";

  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"google-phone" | "email">(
    "google-phone"
  );
  const [emailMode, setEmailMode] = useState<"signin" | "signup">("signin");

  // Phone OTP States
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpToken, setOtpToken] = useState("");

  // Email States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log("[Login] Starting Google sign-in...");
      const res = await signInWithGoogle(nextParam);
      console.log("[Login] Google sign-in response:", res);
      if (res.error) {
        toast.error(res.error);
      } else if (res.url) {
        console.log("[Login] Redirecting to:", res.url);
        window.location.href = res.url;
      } else {
        toast.error("No redirect URL received. Please try again.");
      }
    } catch (err) {
      console.error("[Login] Google sign-in exception:", err);
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
      console.log("[Login] Sending OTP to:", phone);
      const res = await sendOtp(phone);
      console.log("[Login] Send OTP response:", res);
      if (res.error) {
        toast.error(res.error);
      } else {
        setOtpSent(true);
        toast.success("OTP sent! Check your phone.");
      }
    } catch (err) {
      console.error("[Login] Send OTP exception:", err);
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
      console.log("[Login] Verifying OTP for:", phone);
      const res = await verifyOtp(phone, otpToken);
      console.log("[Login] Verify OTP response:", res);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Logged in successfully!");
        window.location.href = nextParam;
      }
    } catch (err) {
      console.error("[Login] Verify OTP exception:", err);
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
      if (emailMode === "signup") {
        formData.append("name", name || "User");
        const res = await signUpWithEmail(formData);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(
            "Account created successfully! Check your email or try logging in."
          );
          setEmailMode("signin");
        }
      } else {
        const res = await signInWithEmail(formData);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Logged in successfully!");
          window.location.href = nextParam;
        }
      }
    } catch {
      toast.error("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex">
      {/* ─── Left Panel: Branding ─── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-ink via-ink to-growth-teal/20 relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-seal-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-growth-teal/8 rounded-full blur-3xl" />

          {/* Staircase visual */}
          <div className="absolute bottom-16 left-12 flex items-end gap-3 opacity-20">
            {[
              { h: "h-12", w: "w-12" },
              { h: "h-20", w: "w-12" },
              { h: "h-28", w: "w-12" },
            ].map((step, i) => (
              <div
                key={i}
                className={`${step.w} ${step.h} border border-white/20 rounded-sm animate-staircase-float`}
                style={{
                  animationDelay: `${i * 0.4}s`,
                  background: `linear-gradient(to top, rgba(192,138,40,${0.1 + i * 0.05}), rgba(255,255,255,${0.02 + i * 0.01}))`,
                }}
              />
            ))}
          </div>

          {/* Compass floating */}
          <div className="absolute top-1/2 right-16 text-seal-gold/15 animate-spin-slow">
            <Compass className="w-20 h-20" />
          </div>

          {/* Grid dots pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>
        </div>

        {/* Brand content */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-seal-gold/15 border border-seal-gold/30 rounded-full flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-seal-gold" />
            </div>
            <span className="font-heading text-xl font-bold text-white tracking-tight">
              Margdarshak
            </span>
          </Link>
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] ml-[52px] block">
            Govt Opportunity Navigator
          </span>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="font-heading text-4xl font-bold text-white leading-tight tracking-tight">
            Let&apos;s find what&apos;s
            <br />
            next for you.
          </h2>
          <p className="text-sm text-white/50 font-sans leading-relaxed max-w-sm">
            Scholarships, fellowships, and internships matched to your
            journey — with clear eligibility and the next step explained.
          </p>

          {/* Mini feature cards */}
          <div className="flex gap-3">
            {[
              "Official Sources",
              "Personalized",
              "Clear Steps",
            ].map((label) => (
              <div
                key={label}
                className="px-3 py-1.5 border border-white/10 rounded-full"
              >
                <span className="font-mono text-[9px] text-white/40 uppercase tracking-wider">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <Link
            href="/"
            className="text-xs text-white/30 hover:text-white/60 font-sans transition-colors flex items-center gap-1"
          >
            <ArrowRight className="w-3 h-3 rotate-180" />
            Back to Margdarshak
          </Link>
        </div>
      </div>

      {/* ─── Right Panel: Auth Form ─── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-paper">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile brand (visible on small screens) */}
          <div className="lg:hidden flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-seal-gold/10 border border-seal-gold rounded-full flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-seal-gold" />
            </div>
            <div>
              <span className="font-heading text-base font-bold text-ink tracking-tight block leading-tight">
                Margdarshak
              </span>
              <span className="text-[8px] font-mono text-horizon-slate uppercase tracking-widest">
                Govt Opportunity Navigator
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-ink tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-sm text-horizon-slate font-sans">
              Sign in to see opportunities matched to your journey.
            </p>
          </div>

          {/* Auth Card */}
          <div className="space-y-5">
            {authMethod === "google-phone" ? (
              <>
                {/* Google OAuth (Primary) */}
                <div className="space-y-3">
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-ink hover:bg-ink/90 text-white rounded-md h-12 flex items-center justify-center gap-2.5 font-sans text-sm font-semibold shadow-lg shadow-ink/10"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg
                        className="w-4 h-4 fill-white"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.186 4.114-3.578 0-6.48-2.903-6.48-6.48s2.902-6.48 6.48-6.48c1.635 0 3.13.6 4.29 1.587l3.093-3.093C19.128 2.185 15.89 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.899 0 10.9-4.22 10.9-11.24 0-.668-.09-1.26-.24-1.954H12.24z" />
                      </svg>
                    )}
                    Continue with Google
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-ink/10" />
                  <span className="flex-shrink mx-4 text-[10px] font-mono uppercase text-ink/30 tracking-wider">
                    or continue with phone
                  </span>
                  <div className="flex-grow border-t border-ink/10" />
                </div>

                {/* Phone + OTP */}
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="phone"
                        className="text-xs font-sans text-ink/70 font-medium"
                      >
                        Mobile Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={loading}
                          className="pl-10 bg-background border-ink/15 rounded-md h-11 font-mono text-sm focus-visible:ring-seal-gold focus-visible:ring-2"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-seal-gold hover:bg-seal-gold/90 text-white rounded-md h-11 font-sans font-semibold text-sm"
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
                        htmlFor="otp"
                        className="text-xs font-sans text-ink/70 font-medium"
                      >
                        Enter 6-digit OTP sent to {phone}
                      </Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                        <Input
                          id="otp"
                          type="text"
                          placeholder="123456"
                          maxLength={6}
                          value={otpToken}
                          onChange={(e) => setOtpToken(e.target.value)}
                          disabled={loading}
                          className="pl-10 bg-background border-ink/15 rounded-md h-11 font-mono text-sm tracking-widest focus-visible:ring-seal-gold focus-visible:ring-2"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOtpSent(false)}
                        disabled={loading}
                        className="flex-1 border-ink/15 hover:bg-ink/5 rounded-md h-11 font-sans text-sm"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-seal-gold hover:bg-seal-gold/90 text-white rounded-md h-11 font-sans font-semibold text-sm"
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
                  className="w-full text-center text-xs font-sans text-horizon-slate hover:text-ink font-medium transition-colors flex items-center justify-center gap-1.5 pt-2"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Use email + password instead
                </button>
              </>
            ) : (
              /* Email + Password */
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/40 text-center mb-1">
                  {emailMode === "signin"
                    ? "Email Authentication"
                    : "Create Your Account"}
                </div>

                {emailMode === "signup" && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="name"
                      className="text-xs font-sans text-ink/70 font-medium"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      className="bg-background border-ink/15 rounded-md h-11 text-sm focus-visible:ring-seal-gold focus-visible:ring-2"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-sans text-ink/70 font-medium"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="bg-background border-ink/15 rounded-md h-11 text-sm focus-visible:ring-seal-gold focus-visible:ring-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-xs font-sans text-ink/70 font-medium"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="bg-background border-ink/15 rounded-md h-11 text-sm focus-visible:ring-seal-gold focus-visible:ring-2"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-ink hover:bg-ink/90 text-white rounded-md h-11 font-sans font-semibold text-sm shadow-lg shadow-ink/10"
                >
                  {loading && (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  )}
                  {emailMode === "signin" ? "Sign In" : "Create Account"}
                </Button>

                {/* Toggle Mode */}
                <div className="text-center pt-1">
                  {emailMode === "signin" ? (
                    <p className="text-xs text-horizon-slate font-sans">
                      New to Margdarshak?{" "}
                      <button
                        type="button"
                        onClick={() => setEmailMode("signup")}
                        className="text-seal-gold font-bold hover:underline"
                      >
                        Register here
                      </button>
                    </p>
                  ) : (
                    <p className="text-xs text-horizon-slate font-sans">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setEmailMode("signin")}
                        className="text-seal-gold font-bold hover:underline"
                      >
                        Sign in here
                      </button>
                    </p>
                  )}
                </div>

                {/* Switch back to Google/Phone */}
                <button
                  type="button"
                  onClick={() => setAuthMethod("google-phone")}
                  className="w-full text-center text-xs font-sans text-horizon-slate hover:text-ink font-medium transition-colors flex items-center justify-center gap-1.5 pt-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Go back to Google & Phone Login
                </button>
              </form>
            )}
          </div>

          {/* Footer links */}
          <div className="text-center pt-4 border-t border-ink/8 space-y-2">
            <p className="text-xs text-horizon-slate font-sans">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => {
                  setAuthMethod("email");
                  setEmailMode("signup");
                }}
                className="text-seal-gold font-bold hover:underline"
              >
                Get started
              </button>
            </p>
            <Link
              href="/"
              className="text-xs text-horizon-slate/50 hover:text-ink/50 font-sans transition-colors inline-flex items-center gap-1"
            >
              <ArrowRight className="w-3 h-3 rotate-180" />
              Back to landing page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-seal-gold" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
