import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function GET(request: Request) {
  // Gate route with cron secret
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const cronSecret = process.env.CRON_SECRET || "margdarshak_cron_secret_token";

  if (key !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return NextResponse.json(
      { error: "Resend API key is not configured in env variables" },
      { status: 500 }
    );
  }

  const resend = new Resend(resendApiKey);

  try {
    // 1. Fetch all applications in saved or in_progress status
    const { data: apps, error: appsErr } = await adminClient
      .from("applications")
      .select("*, opportunity:opportunities(*)")
      .in("status", ["saved", "in_progress"]);

    if (appsErr) {
      return NextResponse.json({ error: appsErr.message }, { status: 500 });
    }

    const emailsSent: string[] = [];

    for (const app of apps || []) {
      const opp = app.opportunity;
      if (!opp || !opp.registration_close_date) continue;

      // 2. Calculate days remaining
      const closeDate = new Date(opp.registration_close_date);
      const now = new Date();
      
      // Calculate day difference at UTC midnight
      const closeMidnight = Date.UTC(
        closeDate.getFullYear(),
        closeDate.getMonth(),
        closeDate.getDate()
      );
      const nowMidnight = Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      
      const diffDays = Math.ceil((closeMidnight - nowMidnight) / (1000 * 60 * 60 * 24));

      // 3. Send email on T-14, T-3, T-1
      if (diffDays === 14 || diffDays === 3 || diffDays === 1) {
        // Retrieve student's email from Auth service using admin client
        const { data: userData, error: userErr } = await adminClient.auth.admin.getUserById(
          app.user_id
        );

        if (userErr || !userData || !userData.user?.email) {
          console.error(`Failed to retrieve email for user ${app.user_id}:`, userErr?.message);
          continue;
        }

        const studentEmail = userData.user.email;
        const studentName = userData.user.user_metadata?.name || "Student";
        const emailFrom = process.env.RESEND_FROM_EMAIL || "Margdarshak <onboarding@resend.dev>";

        // Send transactional email
        try {
          await resend.emails.send({
            from: emailFrom,
            to: studentEmail,
            subject: `Margdarshak: ${opp.title} closes in ${diffDays} ${
              diffDays === 1 ? "day" : "days"
            }!`,
            html: `
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F6F5F1; padding: 30px; border-radius: 4px; border: 1px solid rgba(22, 33, 62, 0.2); max-width: 600px; color: #16213E;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h2 style="font-family: serif; color: #16213E; margin: 0; font-size: 28px;">Margdarshak</h2>
                  <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #5C7290; margin: 5px 0 0 0;">Registry Deadline Alert</p>
                </div>
                <div style="background-color: #ffffff; padding: 24px; border: 1px solid rgba(22, 33, 62, 0.1); border-radius: 2px;">
                  <p style="font-size: 14px; margin-top: 0;">Dear ${studentName},</p>
                  <p style="font-size: 14px; line-height: 1.5;">
                    This is an important reminder from your Margdarshak dashboard. The registration deadline for <strong>${
                      opp.title
                    }</strong> offered by <strong>${opp.provider}</strong> is closing in <strong>${diffDays} ${
                      diffDays === 1 ? "day" : "days"
                    }</strong> (Closing Date: ${opp.registration_close_date}).
                  </p>
                  
                  <div style="margin: 20px 0; padding: 15px; border-top: 1.5px dashed rgba(22, 33, 62, 0.2); border-bottom: 1.5px dashed rgba(22, 33, 62, 0.2); font-family: monospace; font-size: 13px;">
                    <strong>Stipend/Award:</strong> ${opp.amount_or_benefit || "Stipend/Grant"}<br/>
                    <strong>Category:</strong> ${opp.eligibility_rules?.categories?.join(", ") || "All"}<br/>
                    <strong>State:</strong> ${opp.eligibility_rules?.states?.join(", ") || "All India"}
                  </div>

                  <p style="font-size: 14px; line-height: 1.5;">
                    We advise you to double-check all required documents (such as your income certificate, marksheets, and caste certificates) and submit your application on the official portal as soon as possible.
                  </p>

                  <div style="text-align: center; margin-top: 25px;">
                    <a href="${
                      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
                    }/tracker" style="background-color: #C08A28; color: #F6F5F1; padding: 10px 20px; text-decoration: none; border-radius: 2px; font-weight: bold; font-size: 13px; display: inline-block;">
                      Open Application Tracker
                    </a>
                  </div>
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #5C7290;">
                  This is a transactional email sent from your Margdarshak account.
                </div>
              </div>
            `,
          });
          emailsSent.push(studentEmail);
        } catch (emailErr) {
          const errMsg = emailErr instanceof Error ? emailErr.message : String(emailErr);
          console.error(`Failed to send Resend email to ${studentEmail}:`, errMsg);
        }
      }
    }

    return NextResponse.json({
      success: true,
      emailsSentCount: emailsSent.length,
      recipients: emailsSent,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
