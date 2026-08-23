"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserDocuments, uploadDocument, deleteDocument } from "@/app/actions/vault";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft, FolderLock, FileText, Upload, Trash2, CheckCircle2, Shield } from "lucide-react";
import Link from "next/link";
import { getProfile } from "@/app/actions/profile";

const REQUIRED_DOCS = [
  "Income Certificate",
  "Marksheet",
  "Caste Certificate",
  "Aadhar Card",
  "Domicile Certificate",
];

interface VaultDocument {
  id: string;
  user_id: string;
  doc_type: string;
  file_name: string;
  storage_path: string;
  uploaded_at: string;
}

export default function VaultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const profRes = await getProfile();
      if (profRes.error) {
        toast.error("Please sign in first");
        router.push("/login");
        return;
      }
      const res = await getUserDocuments();
      if (res.error) {
        toast.error(res.error);
      } else {
        setDocuments(res.documents || []);
      }
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }
    setUploadingType(docType);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);
      const res = await uploadDocument(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`${docType} uploaded successfully!`);
        loadData();
      }
    } catch {
      toast.error("Failed to upload document");
    } finally {
      setUploadingType(null);
    }
  };

  const handleDelete = async (docId: string, storagePath: string, docType: string) => {
    if (!confirm(`Are you sure you want to delete your ${docType}?`)) return;
    setUploadingType(docType);
    try {
      const res = await deleteDocument(docId, storagePath);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`${docType} deleted from vault`);
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setUploadingType(null);
    }
  };

  const getDocByType = (docType: string) => documents.find((d) => d.doc_type === docType);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const uploadedCount = documents.length;
  const totalCount = REQUIRED_DOCS.length;
  const progress = Math.round((uploadedCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-paper text-ink font-sans pb-16">
      {/* Navbar */}
      <header className="border-b border-ink/8 bg-paper/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-1 hover:bg-ink/[0.03] rounded-md transition-colors">
              <ArrowLeft className="w-4 h-4 text-ink/60" />
            </Link>
            <div>
              <h1 className="font-heading text-[15px] font-bold leading-tight tracking-tight">Document Vault</h1>
              <span className="text-[9px] font-mono text-horizon-slate/60 uppercase tracking-[0.12em] block">
                Secure Personal Registry
              </span>
            </div>
          </div>
          <Link href="/opportunities">
            <Button size="sm" variant="outline" className="border-ink/10 hover:bg-ink/[0.03] rounded-md text-[10px] font-sans h-7 px-2.5">
              Explore Feed
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-ink flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-growth-teal/8 border border-growth-teal/15 flex items-center justify-center">
              <FolderLock className="w-4.5 h-4.5 text-growth-teal" />
            </div>
            Your Private Repository
          </h2>
          <p className="text-xs text-horizon-slate/70 font-sans leading-relaxed">
            Upload credentials once. We cross-reference against scholarship requirements to verify missing paperwork.
          </p>
        </div>

        {/* Progress bar */}
        <div className="p-3 bg-ink/[0.02] border border-ink/6 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-horizon-slate/60 uppercase tracking-wider">Documents</span>
            <span className="text-[10px] font-mono font-bold text-ink/70">{uploadedCount}/{totalCount}</span>
          </div>
          <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-growth-teal rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Security notice */}
        <div className="p-3 bg-growth-teal/[0.03] border border-growth-teal/10 rounded-lg flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-growth-teal mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-ink/60 leading-relaxed">
            All documents are stored in <span className="font-semibold text-ink/80">encrypted Supabase storage</span> and accessible only to you. Formats: <strong>PDF, JPG, PNG</strong> (max 5MB).
          </p>
        </div>

        {/* Document cards */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-seal-gold" />
            <p className="text-xs text-horizon-slate/60 font-mono">Opening secure cabinet...</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {REQUIRED_DOCS.map((docType, i) => {
              const doc = getDocByType(docType);
              const isUploading = uploadingType === docType;
              const isUploaded = !!doc;

              return (
                <div
                  key={docType}
                  className={`group bg-paper border rounded-lg p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all hover:shadow-card ${
                    isUploaded
                      ? "border-growth-teal/15 hover:border-growth-teal/25"
                      : "border-ink/8 hover:border-ink/12"
                  }`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                        isUploaded
                          ? "bg-growth-teal/8 border border-growth-teal/15"
                          : "bg-ink/[0.03] border border-ink/6"
                      }`}>
                        <FileText className={`w-4 h-4 ${isUploaded ? "text-growth-teal" : "text-ink/30"}`} />
                      </div>
                      <span className="text-sm font-semibold text-ink">{docType}</span>
                      {isUploaded ? (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-mono uppercase bg-growth-teal/5 text-growth-teal px-1.5 py-0.5 rounded-md border border-growth-teal/15 font-bold tracking-wider">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-mono uppercase bg-stamp-red/5 text-stamp-red/70 px-1.5 py-0.5 rounded-md border border-stamp-red/10 font-bold tracking-wider">
                          Missing
                        </span>
                      )}
                    </div>
                    {doc ? (
                      <div className="space-y-0.5 pl-10">
                        <p className="text-[11px] text-horizon-slate/60 font-sans truncate max-w-[280px]">
                          {doc.file_name}
                        </p>
                        <span className="text-[9px] font-mono text-horizon-slate/40">
                          {formatDate(doc.uploaded_at)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-horizon-slate/50 font-sans pl-10">
                        Not uploaded yet
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 justify-end pl-10 md:pl-0">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-seal-gold" />
                    ) : doc ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(doc.id, doc.storage_path, docType)}
                        className="hover:bg-stamp-red/5 text-stamp-red/60 hover:text-stamp-red rounded-md h-8 w-8 p-0"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, docType)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button size="sm" className="bg-background hover:bg-ink/[0.03] border border-ink/10 text-ink/70 rounded-md text-[10px] h-8 px-3 flex items-center gap-1.5 font-semibold">
                          <Upload className="w-3.5 h-3.5" /> Upload
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
