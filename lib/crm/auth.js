import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Core CRM authentication/context helper.
 *
 * Used by newer API routes:
 *
 * const context = await getCRMContext();
 *
 * context.user
 * context.admin
 * context.organizationId
 * context.role
 */
export async function getCRMContext() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("CRM AUTH ERROR:", authError);
  }

  if (!user) {
    return {
      user: null,
      admin: null,
      organizationId: null,
      role: null,
      membership: null,
    };
  }

  const admin = createAdminClient();

  const { data: membership, error: membershipError } =
    await admin
      .from("organization_members")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

  if (membershipError) {
    console.error(
      "ORGANIZATION MEMBERSHIP ERROR:",
      membershipError
    );

    throw new Error(
      membershipError.message ||
        "Unable to load organization membership"
    );
  }

  return {
    user,
    admin,
    organizationId:
      membership?.organization_id || null,
    role: membership?.role || null,
    membership: membership || null,
  };
}


/**
 * Backward-compatible helper.
 *
 * Existing Phoniq routes currently use:
 *
 * const context = await requireOrganization();
 *
 * This deliberately returns the same useful aliases
 * expected by both old and new CRM routes.
 */
export async function requireOrganization() {
  const context = await getCRMContext();

  if (!context.user) {
    throw new CRMAuthError(
      "Unauthorized",
      401
    );
  }

  if (!context.organizationId) {
    throw new CRMAuthError(
      "No organization is associated with this account",
      403
    );
  }

  return {
    ...context,

    // compatibility aliases
    organization_id: context.organizationId,
    organizationId: context.organizationId,

    supabaseAdmin: context.admin,
    admin: context.admin,
  };
}


/**
 * Optional custom error so API routes can preserve
 * the appropriate HTTP status.
 */
export class CRMAuthError extends Error {
  constructor(message, status = 500) {
    super(message);

    this.name = "CRMAuthError";
    this.status = status;
  }
}


/**
 * Shared JSON error response.
 */
export function jsonError(
  message = "Something went wrong",
  status = 500
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
    }
  );
}