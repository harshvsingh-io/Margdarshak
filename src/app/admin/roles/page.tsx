"use client";

import React, { useState } from "react";
import { promoteUserByEmail } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShieldCheck, Mail, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function RolesPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "moderator">("moderator");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }
    setSubmitting(true);
    try {
      const res = await promoteUserByEmail(email, role);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`User promoted to ${role} successfully!`);
        setEmail("");
      }
    } catch {
      toast.error("An error occurred during promotion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans pb-16">
      {/* Navigation Header */}
      <header className="border-b border-ink/10 bg-paper sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/moderation">
            <Button size="icon" variant="ghost" className="w-8 h-8 rounded-sm hover:bg-ink/5">
              <ArrowLeft className="w-4 h-4 text-ink" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-lg font-bold leading-tight">Access Control Registry</h1>
            <span className="text-[10px] font-mono text-horizon-slate uppercase tracking-wider block">
              Admin Promotion Center
            </span>
          </div>
        </div>

        <Link href="/">
          <Button
            size="sm"
            variant="outline"
            className="border-ink/20 hover:bg-ink/5 rounded-sm text-xs font-sans"
          >
            Dashboard
          </Button>
        </Link>
      </header>

      <main className="max-w-md mx-auto px-4 mt-12">
        <Card className="border border-ink/20 rounded-sm bg-paper shadow-none relative overflow-hidden before:content-[''] before:absolute before:inset-2 before:border before:border-ink/5 before:pointer-events-none p-2">
          <CardHeader className="text-center pt-6 pb-2">
            <div className="mx-auto w-12 h-12 bg-seal-gold/10 border border-seal-gold rounded-full flex items-center justify-center mb-2">
              <ShieldCheck className="w-6 h-6 text-seal-gold" />
            </div>
            <CardTitle className="font-heading text-xl text-ink">
              Promote User credentials
            </CardTitle>
            <CardDescription className="font-sans text-xs text-horizon-slate">
              Enter a registered user&rsquo;s email to assign administrative clearance.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2 pb-6 px-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-ink/70">
                  Registered Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-ink/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="teammate@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    className="pl-9 bg-paper border-ink/20 rounded-sm font-sans h-10 text-sm focus-visible:ring-seal-gold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs text-ink/70">
                  Clearance Level / Role
                </Label>
                <Select
                  value={role}
                  onValueChange={(val) => {
                    if (val) setRole(val as "admin" | "moderator");
                  }}
                >
                  <SelectTrigger className="bg-paper border-ink/20 rounded-sm h-10 text-sm focus:ring-seal-gold">
                    <SelectValue placeholder="Select target role" />
                  </SelectTrigger>
                  <SelectContent className="bg-paper border-ink/20 rounded-sm">
                    <SelectItem value="moderator" className="text-sm font-sans">
                      Moderator (Approve / Edit listings)
                    </SelectItem>
                    <SelectItem value="admin" className="text-sm font-sans">
                      Admin (Full control + promote roles)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-stamp-red/5 border border-stamp-red/20 rounded-sm text-stamp-red flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] font-sans leading-relaxed">
                  Warning: Assigning moderator or admin access allows the user to approve live listings or promote other users. Ensure the email entered is correct.
                </p>
              </div>

              <div className="tear-off-stub pt-4 mt-6 flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#C08A28] hover:bg-[#C08A28]/90 text-white rounded-sm font-sans font-semibold text-sm"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  Promote User
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
