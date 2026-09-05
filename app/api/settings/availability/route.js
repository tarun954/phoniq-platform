import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function ctx() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const error = new Error("Sign in required.");
    error.status = 401;
    throw error;
  }

  const admin = createAdminClient();

  const { data: member, error } = await admin
    .from("organization_members")
    .select("organization_id,role,role_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!member) {
    const membershipError = new Error("No organization membership found.");
    membershipError.status = 403;
    throw membershipError;
  }

  let roleKey = String(member.role || "").toLowerCase();

  if (member.role_id) {
    const { data: role, error: roleError } = await admin
      .from("organization_roles")
      .select("role_key")
      .eq("id", member.role_id)
      .maybeSingle();

    if (roleError) throw roleError;

    roleKey = String(role?.role_key || roleKey).toLowerCase();
  }

  return {
    admin,
    organizationId: member.organization_id,
    canEdit: ["owner", "admin"].includes(roleKey),
  };
}

function normalizeTime(value, fallback) {
  const raw = String(value || fallback).trim();

  if (!/^\d{2}:\d{2}$/.test(raw)) {
    return fallback;
  }

  return raw;
}

function normalizeSlotMinutes(value) {
  const allowed = new Set([30, 45, 60, 90, 120]);
  const parsed = Number(value);

  return allowed.has(parsed) ? parsed : 60;
}

export async function GET() {
  try {
    const { admin, organizationId, canEdit } = await ctx();

    const { data, error } = await admin
      .from("company_availability")
      .select("*")
      .eq("organization_id", organizationId)
      .order("weekday");

    if (error) throw error;

    return NextResponse.json({
      success: true,
      canEdit,
      availability: data || [],
    });
  } catch (error) {
    const status =
      Number(error?.status) >= 400 ? Number(error.status) : 500;

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to load availability.",
      },
      { status }
    );
  }
}

export async function PUT(request) {
  try {
    const { admin, organizationId, canEdit } = await ctx();

    if (!canEdit) {
      return NextResponse.json(
        {
          success: false,
          error: "Only Owner/Admin can edit availability.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const days = Array.isArray(body?.days) ? body.days : [];

    if (days.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No availability days were provided.",
        },
        { status: 400 }
      );
    }

    const rows = [];

    for (const day of days) {
      const weekday = Number(day.weekday);

      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
        continue;
      }

      const enabled = Boolean(day.enabled);
      const startTime = normalizeTime(day.startTime, "09:00");
      const endTime = normalizeTime(day.endTime, "17:00");
      const slotMinutes = normalizeSlotMinutes(day.slotMinutes);

      if (enabled && startTime >= endTime) {
        return NextResponse.json(
          {
            success: false,
            error: `Start time must be before end time for weekday ${weekday}.`,
          },
          { status: 400 }
        );
      }

      rows.push({
        organization_id: organizationId,
        weekday,
        enabled,
        start_time: startTime,
        end_time: endTime,
        slot_minutes: slotMinutes,
        updated_at: new Date().toISOString(),
      });
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid availability days were provided.",
        },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from("company_availability")
      .upsert(rows, {
        onConflict: "organization_id,weekday",
      });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      updated: rows.length,
    });
  } catch (error) {
    const status =
      Number(error?.status) >= 400 ? Number(error.status) : 500;

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to save availability.",
      },
      { status }
    );
  }
}
