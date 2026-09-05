import { NextResponse } from "next/server";
import {
  requireOrganization,
  jsonError,
} from "@/lib/crm/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { admin, organizationId, user } =
      await requireOrganization();

    const { data, error } = await admin
      .from("notifications")
      .select("*")
      .eq("organization_id", organizationId)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const notifications = data || [];

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: notifications.filter(
        (item) => !item.read_at
      ).length,
    });
  } catch (error) {
    const result = jsonError(
      error,
      "Unable to load notifications"
    );

    return NextResponse.json(result.body, {
      status: result.status,
    });
  }
}

export async function PATCH(request) {
  try {
    const { admin, organizationId, user } =
      await requireOrganization();

    const body = await request.json().catch(() => ({}));
    const id = body?.id || null;
    const markAll = body?.markAll === true;

    if (!markAll && !id) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification id is required",
        },
        { status: 400 }
      );
    }

    let query = admin
      .from("notifications")
      .update({
        read_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .or(`user_id.is.null,user_id.eq.${user.id}`);

    if (markAll) {
      query = query.is("read_at", null);
    } else {
      query = query.eq("id", id);
    }

    const { data, error } = await query.select("id");

    if (error) throw error;

    return NextResponse.json({
      success: true,
      updated: Array.isArray(data) ? data.length : 0,
    });
  } catch (error) {
    const result = jsonError(
      error,
      "Unable to update notification"
    );

    return NextResponse.json(result.body, {
      status: result.status,
    });
  }
}
