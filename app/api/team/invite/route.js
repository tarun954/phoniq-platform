import crypto from "crypto";
import { NextResponse } from "next/server";

import {
  requirePermission,
  permissionErrorResponse,
} from "@/lib/crm/permissions";

import {
  sendTeamInvitationEmail,
} from "@/lib/communications/team-invitation";

export async function POST(request) {
  try {
    const {
      admin,
      organizationId,
      user,
    } = await requirePermission("team.invite");

    const body = await request.json();

    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    const roleId = body?.roleId;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a valid email.",
        },
        { status: 400 }
      );
    }

    if (!roleId) {
      return NextResponse.json(
        {
          success: false,
          error: "Select a role.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 1. Validate role
    // -----------------------------------------

    const {
      data: role,
      error: roleError,
    } = await admin
      .from("organization_roles")
      .select("id,name,role_key")
      .eq("id", roleId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (roleError) throw roleError;

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          error: "Role not found.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // 2. Get company name
    // -----------------------------------------

    const {
      data: organization,
      error: organizationError,
    } = await admin
      .from("organizations")
      .select("id,name")
      .eq("id", organizationId)
      .maybeSingle();

    if (organizationError) {
      throw organizationError;
    }

    const companyName =
      organization?.name || "your company";

    // -----------------------------------------
    // 3. Generate invitation token
    // -----------------------------------------

    const token = crypto
      .randomBytes(32)
      .toString("hex");

    // -----------------------------------------
    // 4. Create invitation
    // -----------------------------------------

    const {
      data: invitation,
      error,
    } = await admin
      .from("organization_invitations")
      .insert({
        organization_id: organizationId,
        email,
        role_id: roleId,
        token,
        status: "pending",
        invited_by: user.id,
      })
      .select(
        "id,email,status,expires_at,created_at,role_id"
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error:
              "A pending invitation already exists for this email.",
          },
          { status: 409 }
        );
      }

      throw error;
    }

    // -----------------------------------------
    // 5. Generate invitation URL
    // -----------------------------------------

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const inviteUrl =
      `${baseUrl}/invite/${token}`;

    // -----------------------------------------
    // 6. Send invitation email
    // -----------------------------------------

    let emailSent = false;
    let emailError = null;

    try {
      await sendTeamInvitationEmail({
        to: email,
        companyName,
        roleName: role.name,
        inviteUrl,
      });

      emailSent = true;
    } catch (sendError) {
      console.error(
        "TEAM INVITATION EMAIL ERROR:",
        sendError
      );

      emailError =
        sendError?.message ||
        "Invitation email could not be sent.";
    }

    // -----------------------------------------
    // 7. Return invitation
    // -----------------------------------------

    return NextResponse.json(
      {
        success: true,
        invitation,
        inviteUrl,
        emailSent,
        emailError,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE TEAM INVITATION ERROR:",
      error
    );

    return permissionErrorResponse(error);
  }
}