import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  announcementId: string;
  status: 'approved' | 'rejected';
  announcementTitle: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-announcement-notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { announcementId, status, announcementTitle }: NotificationRequest = await req.json();
    
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
      console.error("Error fetching announcement:", announcementError);
      throw new Error("Announcement not found");
    }

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      announcement.user_id
    );

    if (userError || !userData?.user?.email) {
      console.error("Error fetching user:", userError);
      throw new Error("User email not found");
    }

    const userEmail = userData.user.email;
    console.log(`Sending notification to: ${userEmail}`);

    // Prepare email content based on status
    const isApproved = status === 'approved';
    const subject = isApproved 
      ? `Your announcement "${announcementTitle}" has been approved!` 
      : `Your announcement "${announcementTitle}" needs attention`;

    const html = isApproved
      ? `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #22c55e; margin-bottom: 20px;">🎉 Announcement Approved!</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Great news! Your announcement <strong>"${announcementTitle}"</strong> has been reviewed and approved by our team.
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
            Unfortunately, your announcement <strong>"${announcementTitle}"</strong> was not approved after review.
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            This could be due to:
          </p>
          <ul style="color: #666; font-size: 14px; line-height: 1.8;">
            <li>Missing or incomplete information</li>
            <li>Content that doesn't meet our guidelines</li>
            <li>Images that need improvement</li>
          </ul>
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
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-announcement-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);