"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOpportunities, toggleSaveOpportunity, ClassifiedOpportunity } from "@/app/actions/opportunities";
import { discoverOpportunities, checkDiscoveryConfig } from "@/app/actions/discover";
import { getUserDocuments } from "@/app/actions/vault";
import { getProfile, ProfileInput } from "@/app/actions/profile";
import OpportunityCard from "@/components/OpportunityCard";
import OpportunityDetailDialog from "@/components/OpportunityDetailDialog";
import ProgressiveProfile from "@/components/ProgressiveProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAGES, INDIAN_STATES } from "@/lib/validations/profile";
import { toast } from "sonner";
import { Loader2, Search, RefreshCw, GraduationCap, CheckCircle2, AlertCircle, HelpCircle, Mic, MicOff } from "lucide-react";
import { translations, Language } from "@/lib/i18n";

export default function OpportunitiesPage() {
  const router = useRouter();
  
  // Language State
  const [lang, setLang] = useState<Language>("en");
  const t = translations[lang];

  // Loading & State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<ProfileInput | null>(null);
  
  // Grouped Buckets
  const [eligibleNow, setEligibleNow] = useState<ClassifiedOpportunity[]>([]);
  const [gapEligible, setGapEligible] = useState<ClassifiedOpportunity[]>([]);
  const [futureEligible, setFutureEligible] = useState<ClassifiedOpportunity[]>([]);
  
  // Selected tab
  const [activeTab, setActiveTab] = useState<"eligible" | "gap" | "future">("eligible");
  const [selectedOpp, setSelectedOpp] = useState<ClassifiedOpportunity | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [discoveryEnabled, setDiscoveryEnabled] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const loadData = async (shouldShowToast = false) => {
    setLoading(true);
    try {
      const profRes = await getProfile();
      if (profRes.error) {
        toast.error("Please sign in first");
        router.push("/login");
        return;
      }
      setProfile(profRes.profile);

      // Fetch user documents for cross-referencing
      const docsRes = await getUserDocuments();
      if (!docsRes.error && docsRes.documents) {
        setUploadedDocs(docsRes.documents.map((d) => d.doc_type as string));
      }

      // Fetch opportunities
      const oppsRes = await getOpportunities({
        type: filterType,
        stage: filterStage,
        state: filterState,
        category: filterCategory,
        search: search,
      });

      if (oppsRes.error) {
        toast.error(oppsRes.error);
      } else {
        setEligibleNow(oppsRes.eligibleNow || []);
        setGapEligible(oppsRes.gapEligible || []);
        setFutureEligible(oppsRes.futureEligible || []);
        if (shouldShowToast) {
          toast.success(lang === "hi" ? "अवसरों की सूची रीफ़्रेश की गई!" : "Opportunities refreshed successfully!");
        }
      }
    } catch {
      toast.error(lang === "hi" ? "डेटा लोड करने में विफल" : "Failed to load feed data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Check if discovery API keys are configured
    checkDiscoveryConfig().then((res) => {
      setDiscoveryEnabled(res.configured);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterStage, filterState, filterCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = typeof window !== "undefined"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
      : null;

    if (!SpeechRecognition) {
      toast.error(t.speechError);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === "en" ? "en-IN" : "hi-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      toast.info(t.listening);
    };

    recognition.onerror = () => {
      setListening(false);
      toast.error(t.speechError);
    };

    recognition.onend = () => {
      setListening(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      toast.success(lang === "hi" ? `वॉयस इनपुट: "${transcript}"` : `Voice query: "${transcript}"`);
      
      // Auto-load data based on speech transcript
      setLoading(true);
      getOpportunities({
        type: filterType,
        stage: filterStage,
        state: filterState,
        category: filterCategory,
        search: transcript,
      }).then((oppsRes) => {
        if (!oppsRes.error) {
          setEligibleNow(oppsRes.eligibleNow || []);
          setGapEligible(oppsRes.gapEligible || []);
          setFutureEligible(oppsRes.futureEligible || []);
        }
        setLoading(false);
      });
    };

    recognition.start();
  };

  const handleRefreshSearch = async () => {
    setRefreshing(true);
    toast.info(lang === "hi" ? "लाइव सरकारी पोर्टल खोज रहे हैं... कृपया ३० सेकंड प्रतीक्षा करें।" : "Searching live government portals... This may take up to 30 seconds.");
    try {
      const res = await discoverOpportunities();
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          lang === "hi" 
            ? `खोज पूरी हुई! लाइव लिंक्स: ${res.newLinksDiscovered}, सेव्ड रिकॉर्ड: ${res.recordsSaved}`
            : `Discovery Complete! Run queries: ${res.apiQueriesRun}, New links found: ${res.newLinksDiscovered}, Saved: ${res.recordsSaved}`
        );
        loadData();
      }
    } catch {
      toast.error("An error occurred during discovery refresh");
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleSave = async (oppId: string) => {
    setSavingId(oppId);
    try {
      const res = await toggleSaveOpportunity(oppId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          res.saved 
            ? (lang === "hi" ? "अवसर रजिस्ट्री में सेव किया गया" : "Opportunity saved to registry")
            : (lang === "hi" ? "अवसर रजिस्ट्री से हटा दिया गया" : "Opportunity removed")
        );
        
        // Optimistic UI updates
        const updateList = (list: ClassifiedOpportunity[]) =>
          list.map((o) => (o.id === oppId ? { ...o, isSaved: !!res.saved } : o));
        
        setEligibleNow(updateList(eligibleNow));
        setGapEligible(updateList(gapEligible));
        setFutureEligible(updateList(futureEligible));
      }
    } catch {
      toast.error("Failed to save opportunity");
    } finally {
      setSavingId(null);
    }
  };

  const handleViewDetails = (opp: ClassifiedOpportunity) => {
    setSelectedOpp(opp);
    setDialogOpen(true);
  };

  const activeList =
    activeTab === "eligible"
      ? eligibleNow
      : activeTab === "gap"
      ? gapEligible
      : futureEligible;

  return (
    <div className="min-h-screen bg-paper text-ink font-sans pb-16">
      {/* Navigation Header */}
      <header className="border-b border-ink/10 bg-paper sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-seal-gold/10 border border-seal-gold rounded-full flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-seal-gold" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold leading-tight">{t.title}</h1>
            <span className="text-[10px] font-mono text-horizon-slate uppercase tracking-wider block">
              {t.subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Regional Language Toggle EN / हिन्दी */}
          <div className="flex items-center border border-ink/20 rounded-sm overflow-hidden h-8">
            <button
              onClick={() => setLang("en")}
              className={`text-[10px] font-bold px-2.5 h-full ${
                lang === "en" ? "bg-ink text-paper" : "bg-paper text-ink/70 hover:bg-ink/5"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("hi")}
              className={`text-[10px] font-bold px-2.5 h-full font-sans ${
                lang === "hi" ? "bg-ink text-paper" : "bg-paper text-ink/70 hover:bg-ink/5"
              }`}
            >
              हिन्दी
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/")}
            className="border-ink/20 hover:bg-ink/5 rounded-sm text-xs font-sans h-8"
          >
            {t.dashboard}
          </Button>
          
          <Button
            size="sm"
            disabled={refreshing || !discoveryEnabled}
            onClick={handleRefreshSearch}
            title={!discoveryEnabled ? "Add API keys to Vercel env vars to enable live discovery" : undefined}
            className={`${
              discoveryEnabled
                ? "bg-[#C08A28] hover:bg-[#C08A28]/90 text-white"
                : "bg-ink/20 text-ink/40 cursor-not-allowed"
            } rounded-sm text-xs flex items-center gap-1 font-semibold h-8`}
          >
            {refreshing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {!discoveryEnabled ? "API keys needed" : t.findLive}
            </span>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Progressive Profile Prompts */}
        {profile && (
          <ProgressiveProfile
            profile={profile}
            onUpdate={() => {
              loadData();
            }}
          />
        )}

        {/* Filter Controls */}
        <div className="border border-ink/20 rounded-sm p-4 bg-paper relative overflow-hidden before:content-[''] before:absolute before:inset-1 before:border before:border-ink/5 before:pointer-events-none space-y-3.5">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-grow flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-ink/40" />
              <Input
                type="text"
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-10 bg-paper border-ink/20 rounded-sm font-sans h-10 text-sm focus-visible:ring-seal-gold"
              />
              
              {/* Web Speech API Microphone trigger */}
              <button
                type="button"
                onClick={startVoiceSearch}
                className={`absolute right-3 p-1 rounded-full transition-colors ${
                  listening ? "bg-stamp-red/10 text-stamp-red animate-pulse" : "text-ink/50 hover:text-ink"
                }`}
                title="Voice Search"
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            <Button
              type="submit"
              className="bg-[#16213E] hover:bg-[#16213E]/90 text-white rounded-sm text-sm h-10 font-semibold px-4"
            >
              {t.searchBtn}
            </Button>
          </form>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Type */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-horizon-slate uppercase tracking-wider block">
                {t.typeLabel}
              </span>
              <Select value={filterType} onValueChange={(val) => setFilterType(val || "all")}>
                <SelectTrigger className="bg-paper border-ink/20 rounded-sm h-9 text-xs focus:ring-seal-gold">
                  <SelectValue placeholder={t.allTypes} />
                </SelectTrigger>
                <SelectContent className="bg-paper border-ink/20 rounded-sm">
                  <SelectItem value="all" className="text-xs">{t.allTypes}</SelectItem>
                  <SelectItem value="scholarship" className="text-xs">Scholarship</SelectItem>
                  <SelectItem value="fellowship" className="text-xs">Fellowship</SelectItem>
                  <SelectItem value="internship" className="text-xs">Internship</SelectItem>
                  <SelectItem value="program" className="text-xs">Program</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stage */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-horizon-slate uppercase tracking-wider block">
                {t.stageLabel}
              </span>
              <Select value={filterStage} onValueChange={(val) => setFilterStage(val || "all")}>
                <SelectTrigger className="bg-paper border-ink/20 rounded-sm h-9 text-xs focus:ring-seal-gold">
                  <SelectValue placeholder={t.allStages} />
                </SelectTrigger>
                <SelectContent className="bg-paper border-ink/20 rounded-sm">
                  <SelectItem value="all" className="text-xs font-sans">{t.allStages}</SelectItem>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize text-xs font-sans">
                      {s === "12th" ? "Class 12 Pass-out" : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* State */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-horizon-slate uppercase tracking-wider block">
                {t.stateLabel}
              </span>
              <Select value={filterState} onValueChange={(val) => setFilterState(val || "all")}>
                <SelectTrigger className="bg-paper border-ink/20 rounded-sm h-9 text-xs focus:ring-seal-gold">
                  <SelectValue placeholder={t.allStates} />
                </SelectTrigger>
                <SelectContent className="bg-paper border-ink/20 rounded-sm">
                  <SelectItem value="all" className="text-xs font-sans">{t.allStates}</SelectItem>
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs font-sans">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-horizon-slate uppercase tracking-wider block">
                {t.categoryLabel}
              </span>
              <Select value={filterCategory} onValueChange={(val) => setFilterCategory(val || "all")}>
                <SelectTrigger className="bg-paper border-ink/20 rounded-sm h-9 text-xs focus:ring-seal-gold">
                  <SelectValue placeholder={t.allCategories} />
                </SelectTrigger>
                <SelectContent className="bg-paper border-ink/20 rounded-sm">
                  <SelectItem value="all" className="text-xs font-sans">{t.allCategories}</SelectItem>
                  <SelectItem value="General" className="text-xs font-sans">General</SelectItem>
                  <SelectItem value="OBC" className="text-xs font-sans">OBC</SelectItem>
                  <SelectItem value="SC" className="text-xs font-sans">SC</SelectItem>
                  <SelectItem value="ST" className="text-xs font-sans">ST</SelectItem>
                  <SelectItem value="EWS" className="text-xs font-sans">EWS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Staircase Visual Tab Navigation */}
        <div className="space-y-4">
          <div className="flex items-end justify-center gap-1.5 h-16 border-b border-ink/10 pb-1">
            {/* Step 1: Eligible Now */}
            <button
              onClick={() => setActiveTab("eligible")}
              className={`flex-1 flex items-center justify-center gap-1.5 h-9 border border-b-0 rounded-t-sm transition-all text-xs font-semibold uppercase font-sans ${
                activeTab === "eligible"
                  ? "bg-growth-teal text-white border-growth-teal"
                  : "bg-paper text-growth-teal border-ink/10 hover:bg-ink/5"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {t.eligibleNow} ({eligibleNow.length})
            </button>

            {/* Step 2: Gap-Eligible */}
            <button
              onClick={() => setActiveTab("gap")}
              className={`flex-1 flex items-center justify-center gap-1.5 h-12 border border-b-0 rounded-t-sm transition-all text-xs font-semibold uppercase font-sans ${
                activeTab === "gap"
                  ? "bg-[#C08A28] text-white border-[#C08A28]"
                  : "bg-paper text-[#C08A28] border-ink/10 hover:bg-ink/5"
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              {t.gapEligible} ({gapEligible.length})
            </button>

            {/* Step 3: Future-Eligible */}
            <button
              onClick={() => setActiveTab("future")}
              className={`flex-1 flex items-center justify-center gap-1.5 h-16 border border-b-0 rounded-t-sm transition-all text-xs font-semibold uppercase font-sans ${
                activeTab === "future"
                  ? "bg-[#5C7290] text-white border-[#5C7290]"
                  : "bg-paper text-[#5C7290] border-ink/10 hover:bg-ink/5"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              {t.futureEligible} ({futureEligible.length})
            </button>
          </div>

          {/* Opportunities list */}
          {loading ? (
            <div className="py-16 text-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-seal-gold" />
              <span className="text-sm font-sans text-horizon-slate">
                {t.loadingOpps}
              </span>
            </div>
          ) : activeList.length === 0 ? (
            <div className="py-12 border border-dashed border-ink/20 rounded-sm text-center bg-paper p-6">
              <GraduationCap className="w-10 h-10 mx-auto text-ink/30 mb-2" />
              <h3 className="font-heading text-lg font-bold text-ink">{t.noResultsTitle}</h3>
              <p className="text-xs text-horizon-slate font-sans max-w-sm mx-auto mt-1">
                {t.noResultsDesc}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {activeList.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onToggleSave={handleToggleSave}
                  onViewDetails={handleViewDetails}
                  savingId={savingId}
                  lang={lang}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Details Dialog */}
      <OpportunityDetailDialog
        opportunity={selectedOpp}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        uploadedDocs={uploadedDocs}
        lang={lang}
      />
    </div>
  );
}
