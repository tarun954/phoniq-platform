import { NextResponse } from "next/server";
import { requireOrganization } from "@/lib/crm/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const {
      admin,
      organizationId,
    } = await requireOrganization();

    const {
      data,
      error,
    } = await admin
      .from("client_realtime_notifications")
      .select("*")
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "read",
        false
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      notifications: data || [],
    });
  } catch (error) {
    const status =
      Number(error?.status) >= 400
        ? Number(error.status)
        : 500;

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to load popup notifications.",
      },
      {
        status,
      }
    );
  }
}

export async function PATCH(request) {
  try {
    const {
      admin,
      organizationId,
    } = await requireOrganization();

    const body =
      await request.json();

    /*
     * Mark one notification as read.
     */
    if (body?.id) {
      const {
        data,
        error,
      } = await admin
        .from("client_realtime_notifications")
        .update({
          read: true,
        })
        .eq(
          "organization_id",
          organizationId
        )
        .eq(
          "id",
          body.id
        )
        .select("id")
        .maybeSingle();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        notification: data || null,
      });
    }

    /*
     * Optional mark-all-as-read support.
     */
    const {
      error,
    } = await admin
      .from("client_realtime_notifications")
      .update({
        read: true,
      })
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "read",
        false
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const status =
      Number(error?.status) >= 400
        ? Number(error.status)
        : 500;

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to update popup notification.",
      },
      {
        status,
      }
    );
  }
}