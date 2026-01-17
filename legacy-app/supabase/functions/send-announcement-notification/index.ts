import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const requestSchema = z.object({
  announcementId: z.string().uuid("Invalid announcement ID format"),
  status: z.enum(['approved', 'rejected'], { errorMap: () => ({ message: "Status must be 'approved' or 'rejected'" }) }),
  announcementTitle: z.string().min(1, "Title is required").max(200, "Title too long"),
  rejectionReason: z.string().max(1000, "Rejection reason too long").optional(),
});

// Simple HTML sanitization to prevent XSS
function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-announcement-notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = requestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.log("Validation failed:", validationResult.error.issues.map(i => i.message).join(", "));
      return new Response(
        JSON.stringify({ error: "Invalid request data", details: validationResult.error.issues }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { announcementId, status, announcementTitle, rejectionReason } = validationResult.data;
    
    // Sanitize user-provided content for HTML template
    const sanitizedTitle = sanitizeHtml(announcementTitle);
    const sanitizedReason = rejectionReason ? sanitizeHtml(rejectionReason) : undefined;
    
    console.log(`Processing notification for announcement ${announcementId}, status: ${status}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the announcement owner's email
    const { data: announcement, error: announcementError } = await supabase
      .from("announcements")
      .select("user_id")
      .eq("id", announcementId)
      .single();

    if (announcementError || !announcement) {
      console.log("Announcement not found for ID:", announcementId);
      return new Response(
        JSON.stringify({ error: "Announcement not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      announcement.user_id
    );

    if (userError || !userData?.user?.email) {
      console.log("User email not found for user ID:", announcement.user_id);
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const userEmail = userData.user.email;
    console.log(`Sending notification to user`);

    // Prepare email content based on status
    const isApproved = status === 'approved';
    const subject = isApproved 
      ? `Your announcement "${sanitizedTitle}" has been approved!` 
      : `Your announcement "${sanitizedTitle}" needs attention`;

    const html = isApproved
      ? `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #22c55e; margin-bottom: 20px;">🎉 Announcement Approved!</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Great news! Your announcement <strong>"${sanitizedTitle}"</strong> has been reviewed and approved by our team.
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Your listing is now live and visible to all users on our platform.
          </p>
          <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px;">
            <p style="color: #166534; margin: 0; font-size: 14px;">
              Thank you for using Echo Wave Central!
            </p>
          </div>
        </div>
      `
      : `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444; margin-bottom: 20px;">Announcement Not Approved</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Unfortunately, your announcement <strong>"${sanitizedTitle}"</strong> was not approved after review.
          </p>
          ${sanitizedReason ? `
          <div style="margin: 20px 0; padding: 15px; background-color: #fff7ed; border-left: 4px solid #ea580c; border-radius: 4px;">
            <p style="color: #9a3412; margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">Reason for rejection:</p>
            <p style="color: #c2410c; margin: 0; font-size: 14px;">${sanitizedReason}</p>
          </div>
          ` : `
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            This could be due to:
          </p>
          <ul style="color: #666; font-size: 14px; line-height: 1.8;">
            <li>Missing or incomplete information</li>
            <li>Content that doesn't meet our guidelines</li>
            <li>Images that need improvement</li>
          </ul>
          `}
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Please review your listing, make the necessary changes, and resubmit for approval.
          </p>
          <div style="margin-top: 30px; padding: 20px; background-color: #fef2f2; border-radius: 8px;">
            <p style="color: #991b1b; margin: 0; font-size: 14px;">
              If you have questions, please contact our support team.
            </p>
          </div>
        </div>
      `;

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Echo Wave Central <onboarding@resend.dev>",
        to: [userEmail],
        subject: subject,
        html: html,
      }),
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.log("Email sending failed with status:", emailResponse.status, "Response:", JSON.stringify(emailData));
      // Return more details about the failure
      return new Response(
        JSON.stringify({ 
          error: "Failed to send email", 
          details: emailData,
          hint: emailResponse.status === 403 
            ? "The 'from' email domain may not be verified in Resend. Using onboarding@resend.dev only works for sending to the Resend account owner's email."
            : undefined
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.log("Error processing notification request");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);