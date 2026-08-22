"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { GOVT_ALLOWLIST, opportunitySchema } from "@/lib/validations/opportunity";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

// Helper to fetch and extract clean text from html
async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      signal: AbortSignal.timeout(5000), // 5 seconds timeout
    });
    
    if (!res.ok) return "";
    
    const html = await res.text();
    
    // Strip script and style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    // Strip HTML tags
    text = text.replace(/<[^>]+>/g, " ");
    // Collapse spaces
    text = text.replace(/\s+/g, " ").trim();
    
    return text.substring(0, 5000); // Truncate to first 5000 characters
  } catch {
    return "";
  }
}

// Extract domain from URL
function getDomainFromUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname.replace("www.", "").toLowerCase();
  } catch {
    return "";
  }
}

export async function checkDiscoveryConfig() {
  const searchApiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  return {
    configured: !!(searchApiKey && cseId && geminiApiKey),
  };
}

export async function discoverOpportunities() {
  const supabase = createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // 1. Get user profile
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    return { error: "Failed to retrieve student profile" };
  }

  // 2. Build 3-5 targeted search queries
  const queries: string[] = [];
  const stage = profile.current_stage || "student";
  const category = profile.category || "General";
  const state = profile.state || "Rajasthan";
  const interests = profile.interests || [];

  queries.push(`scholarship for ${stage} category ${category} ${state}`);
  queries.push(`fellowship for ${stage} ${state}`);
  
  if (interests.length > 0) {
    queries.push(`internship program ${interests[0]} ${state}`);
    queries.push(`scholarship ${stage} ${interests[0]}`);
  } else {
    queries.push(`government scholarship portal ${state}`);
    queries.push(`aicte ugc fellowships ${stage}`);
  }

  // Limit to 4 queries
  const activeQueries = queries.slice(0, 4);

  const searchApiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!searchApiKey || !cseId || !geminiApiKey) {
    return {
      error: "Live discovery is not configured yet. Add GEMINI_API_KEY, GOOGLE_SEARCH_API_KEY, and GOOGLE_CSE_ID to your environment variables.",
      notConfigured: true,
    };
  }

  let totalQueriesChecked = 0;
  let apiQueriesRun = 0;
  let newLinksDiscovered = 0;
  let recordsSaved = 0;
  let validationFailures = 0;

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  for (const query of activeQueries) {
    totalQueriesChecked++;
    
    // 3. Cache check: Check search_queries_log
    const { data: logEntry } = await adminClient
      .from("search_queries_log")
      .select("*")
      .eq("query_text", query)
      .single();

    if (logEntry) {
      const lastRun = new Date(logEntry.last_run_at);
      const diffHours = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);
      if (diffHours < 24) {
        // Cache hit: Skip query
        continue;
      }
    }

    // 4. API Search Call
    apiQueriesRun++;
    let results: SearchResult[] = [];
    try {
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${searchApiKey}&cx=${cseId}&q=${encodeURIComponent(
        query
      )}`;
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const items = (searchData.items || []) as Record<string, string>[];
        results = items.map((item) => ({
          title: item.title || "",
          link: item.link || "",
          snippet: item.snippet || "",
        }));
      }
    } catch (err) {
      console.error(`Search failed for query "${query}":`, err);
      continue;
    }

    for (const item of results) {
      const link = item.link;
      const domain = getDomainFromUrl(link);

      // Verify domain matches allowlist
      const matchesAllowlist = GOVT_ALLOWLIST.some(
        (allowed) => domain === allowed || domain.endsWith("." + allowed)
      );

      if (!matchesAllowlist) {
        // Reject immediately: Only official government sources allowed
        continue;
      }

      newLinksDiscovered++;

      // Check if source_url already exists in the database
      const { data: existingOpp } = await adminClient
        .from("opportunities")
        .select("id")
        .eq("source_url", link)
        .single();

      if (existingOpp) {
        // Skip extraction, already in database
        continue;
      }

      // Fetch page text content, fallback to snippet
      const pageText = await fetchPageText(link);
      const sourceContent = pageText
        ? pageText
        : `Title: ${item.title}\nSnippet: ${item.snippet}`;

      // Call Gemini for structured data extraction
      try {
        const prompt = `
          Extract scholarship, fellowship, internship, or educational program opportunity details from the text below.
          Return a JSON object matching this schema:
          {
            "title": "Clean, descriptive title of the opportunity",
            "type": "scholarship" | "fellowship" | "internship" | "program",
            "provider": "The name of the government department, ministry, or organization providing it",
            "description": "Brief description of the opportunity",
            "apply_url": "Direct link to apply (if visible)",
            "registration_open_date": "YYYY-MM-DD" or null if not specified,
            "registration_close_date": "YYYY-MM-DD" or null if not specified,
            "eligibility_rules": {
              "min_percentage": number (percentage or cgpa converted to percentage, e.g. 75, or null if none),
              "max_income": number (maximum annual household income allowed in ₹, e.g. 250000, or null if none),
              "stages": array of educational stages allowed (must contain only values from: "school", "12th", "undergrad", "postgrad", "working"),
              "categories": array of castes/categories allowed (e.g. ["SC", "ST", "OBC", "EWS"], or ["any"] if open to all),
              "states": array of states allowed (e.g. ["Rajasthan"], or ["any"] if open to all),
              "gender": "Female" | "Male" | "any"
            },
            "required_documents": array of document names required (e.g. ["Income Certificate", "Caste Certificate"]),
            "amount_or_benefit": "Description of financial aid or stipend (e.g. ₹50,000 per year or ₹12,000 per month stipend)",
            "extraction_confidence": "high" (if eligibility rules and dates are clearly stated) or "medium" or "low" (if eligibility rules or dates are missing or ambiguous)
          }

          Source text to extract from:
          ${sourceContent}
        `;

        const geminiRes = await model.generateContent(prompt);
        const textResponse = geminiRes.response.text();
        const extractedData = JSON.parse(textResponse);

        // Inject source fields
        extractedData.source_url = link;
        extractedData.source_domain = domain;

        // Validate structure with Zod
        const validation = opportunitySchema.safeParse(extractedData);

        if (!validation.success) {
          validationFailures++;
          const errors = validation.error.issues
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", ");

          // Write failure to data_issues
          await adminClient.from("data_issues").insert({
            source: "discovery_pipeline",
            reason: errors,
            raw_payload: extractedData,
          });

          continue;
        }

        const validOpp = validation.data;

        // Auto-approval rule (Backend Hardening Stage 3)
        // Set moderation_status to approved if extraction_confidence is high, otherwise pending
        const moderation_status =
          validOpp.extraction_confidence === "high" ? "approved" : "pending";

        // Save to opportunities table
        const { error: saveErr } = await adminClient.from("opportunities").insert({
          ...validOpp,
          moderation_status,
          last_verified_at: new Date().toISOString(),
        });

        if (!saveErr) {
          recordsSaved++;
        } else {
          console.error("Failed to save opportunity to database:", saveErr.message);
        }
      } catch (geminiErr) {
        console.error("Gemini processing error:", geminiErr);
        continue;
      }
    }

    // 5. Update or insert the search_queries_log
    await adminClient.from("search_queries_log").upsert(
      {
        query_text: query,
        last_run_at: new Date().toISOString(),
        result_count: results.length,
      },
      { onConflict: "query_text" }
    );
  }

  // Refresh caching
  revalidatePath("/", "layout");

  return {
    success: true,
    totalQueriesChecked,
    apiQueriesRun,
    newLinksDiscovered,
    recordsSaved,
    validationFailures,
  };
}
