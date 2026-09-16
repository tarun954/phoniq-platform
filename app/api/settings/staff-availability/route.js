import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function getContext() {
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
    const membershipError = new Error(
      "No organization membership found."
    );
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

function normalizeSlotMinutes(value) {
  const allowed = new Set([30, 45, 60, 90, 120]);
  const parsed = Number(value);
  return allowed.has(parsed) ? parsed : 60;
}

function normalizeTime(value, fallback) {
  const raw = String(value || fallback).slice(0, 5);
  return /^\d{2}:\d{2}$/.test(raw) ? raw : fallback;
}

export async function GET() {
  try {
    const { admin, organizationId, canEdit } =
      await getContext();

    const { data: staff, error: staffError } = await admin
      .from("service_staff")
      .select("*")
      .eq("organization_id", organizationId)
      .order("active", { ascending: false })
      .order("name", { ascending: true });

    if (staffError) throw staffError;

    const staffIds = (staff || []).map((item) => item.id);

    let availability = [];

    if (staffIds.length > 0) {
      const { data, error } = await admin
        .from("staff_availability")
        .select("*")
        .eq("organization_id", organizationId)
        .in("staff_id", staffIds)
        .order("weekday", { ascending: true });

      if (error) throw error;
      availability = data || [];
    }

    return NextResponse.json({
      success: true,
      canEdit,
      staff: staff || [],
      availability,
    });
  } catch (error) {
    const status =
      Number(error?.status) >= 400 ? Number(error.status) : 500;

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to load staff availability.",
      },
      { status }
    );
  }
}

export async function POST(request) {
  try {
    const { admin, organizationId, canEdit } =
      await getContext();

    if (!canEdit) {
      return NextResponse.json(
        {
          success: false,
          error: "Only Owner/Admin can add staff.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim() || null;
    const phone = String(body?.phone || "").trim() || null;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Person name is required.",
        },
        { status: 400 }
      );
    }

    const { data: staff, error } = await admin
      .from("service_staff")
      .insert({
        organization_id: organizationId,
        name,
        email,
        phone,
        active: true,
      })
      .select("*")
      .single();

    if (error) throw error;

    const defaultDays = [0, 1, 2, 3, 4, 5, 6].map(
      (weekday) => ({
        organization_id: organizationId,
        staff_id: staff.id,
        weekday,
        enabled: weekday >= 1 && weekday <= 5,
        start_time: "09:00",
        end_time: "17:00",
        slot_minutes: 60,
      })
    );

    const { error: availabilityError } = await admin
      .from("staff_availability")
      .insert(defaultDays);

    if (availabilityError) throw availabilityError;

    return NextResponse.json({
      success: true,
      staff,
    });
  } catch (error) {
    const status =
      Number(error?.status) >= 400 ? Number(error.status) : 500;

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to add staff.",
      },
      { status }
    );
  }
}

export async function PUT(request) {
  try {
    const { admin, organizationId, canEdit } =
      await getContext();

    if (!canEdit) {
      return NextResponse.json(
        {
          success: false,
          error: "Only Owner/Admin can edit staff.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const staffId = String(body?.staffId || "").trim();

    if (!staffId) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff id is required.",
        },
        { status: 400 }
      );
    }

    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim() || null;
    const phone = String(body?.phone || "").trim() || null;
    const active = body?.active !== false;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Person name is required.",
        },
        { status: 400 }
      );
    }

    const { error: staffError } = await admin
      .from("service_staff")
      .update({
        name,
        email,
        phone,
        active,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .eq("id", staffId);

    if (staffError) throw staffError;

    const days = Array.isArray(body?.days) ? body.days : [];

    const rows = [];

    for (const day of days) {
      const weekday = Number(day.weekday);

      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
        continue;
      }

      const enabled = Boolean(day.enabled);
      const startTime = normalizeTime(
        day.startTime,
        "09:00"
      );
      const endTime = normalizeTime(
        day.endTime,
        "17:00"
      );

      if (enabled && startTime >= endTime) {
        return NextResponse.json(
          {
            success: false,
            error: "Start time must be before end time.",
          },
          { status: 400 }
        );
      }

      rows.push({
        organization_id: organizationId,
        staff_id: staffId,
        weekday,
        enabled,
        start_time: startTime,
        end_time: endTime,
        slot_minutes: normalizeSlotMinutes(
          day.slotMinutes
        ),
        updated_at: new Date().toISOString(),
      });
    }

    if (rows.length > 0) {
      const { error: availabilityError } = await admin
        .from("staff_availability")
        .upsert(rows, {
          onConflict: "staff_id,weekday",
        });

      if (availabilityError) throw availabilityError;
    }

    return NextResponse.json({
      success: true,
      updatedDays: rows.length,
    });
  } catch (error) {
    const status =
      Number(error?.status) >= 400 ? Number(error.status) : 500;

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message || "Unable to update staff.",
      },
      { status }
    );
  }
}

export async function DELETE(request) {
  try {
    const { admin, organizationId, canEdit } =
      await getContext();

    if (!canEdit) {
      return NextResponse.json(
        {
          success: false,
          error: "Only Owner/Admin can remove staff.",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const staffId = String(body?.staffId || "").trim();

    if (!staffId) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff id is required.",
        },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from("service_staff")
      .delete()
      .eq("organization_id", organizationId)
      .eq("id", staffId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const status =
      Number(error?.status) >= 400 ? Number(error.status) : 500;

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to remove staff.",
      },
      { status }
    );
  }
}
