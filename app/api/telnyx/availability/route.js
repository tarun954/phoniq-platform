import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAvailableSlots } from '@/lib/appointments/getAvailableSlots';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function phone(v) {
  const d = String(v || '').replace(/\D/g, '');

  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;

  return String(v || '');
}

function normalizeToolSecret(value) {
  const secret = String(value || '').trim();

  if (
    (secret.startsWith('"') && secret.endsWith('"')) ||
    (secret.startsWith("'") && secret.endsWith("'"))
  ) {
    return secret.slice(1, -1);
  }

  return secret;
}

function isAuthorized(request) {
  const expectedSecret = normalizeToolSecret(
    process.env.PHONIQ_TELNYX_TOOL_SECRET ||
      process.env.TELNYX_TOOL_SECRET
  );

  const receivedSecret = normalizeToolSecret(
    request.headers.get('x-phoniq-tool-secret')
  );

  return Boolean(
    expectedSecret &&
      receivedSecret &&
      receivedSecret === expectedSecret
  );
}

export async function POST(request) {
  try {
    if (!isAuthorized(request)) {
      const rawExpected =
        process.env.PHONIQ_TELNYX_TOOL_SECRET ||
        process.env.TELNYX_TOOL_SECRET ||
        '';

      const rawReceived =
        request.headers.get('x-phoniq-tool-secret') || '';

      const normalizedExpected =
        normalizeToolSecret(rawExpected);

      const normalizedReceived =
        normalizeToolSecret(rawReceived);

      const fingerprint = (value) =>
        crypto
          .createHash('sha256')
          .update(value)
          .digest('hex')
          .slice(0, 12);

      console.log('PHONIQ AUTH SAFE DEBUG', {
        rawExpectedLength: rawExpected.length,
        normalizedExpectedLength:
          normalizedExpected.length,
        rawReceivedLength: rawReceived.length,
        normalizedReceivedLength:
          normalizedReceived.length,
        matches:
          normalizedExpected === normalizedReceived,
        expectedFingerprint:
          fingerprint(normalizedExpected),
        receivedFingerprint:
          fingerprint(normalizedReceived),
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized tool request.',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const calledPhone = phone(
      body.called_phone ||
        body.calledPhone ||
        body.to
    );

    const requestedDate = String(
      body.requested_date ||
        body.requestedDate ||
        ''
    );

    if (
      !calledPhone ||
      !/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'called_phone and requested_date (YYYY-MM-DD) are required.',
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: row, error } = await admin
      .from('phone_numbers')
      .select('organization_id,phone_number')
      .eq('phone_number', calledPhone)
      .maybeSingle();

    if (error) throw error;

    if (!row?.organization_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No organization is mapped to this business phone.',
        },
        { status: 404 }
      );
    }

    const a = await getAvailableSlots({
      admin,
      organizationId: row.organization_id,
      requestedDate,
      limit: 8,
    });

    return NextResponse.json({
      success: true,
      organization_id: row.organization_id,
      company_name: a.companyName,
      timezone: a.timezone,
      requested_date: requestedDate,
      available: a.slots.length > 0,
      reason: a.reason,
      slots: a.slots.map((s) => ({
        date: s.date,
        time: s.time,
        staff_id: s.staffId,
        staff_name: s.staffName,
        scheduled_at: s.scheduledAt,
      })),
    });
  } catch (e) {
    console.error(
      'TELNYX AVAILABILITY ERROR',
      e
    );

    return NextResponse.json(
      {
        success: false,
        error:
          e?.message ||
          'Unable to check availability.',
      },
      { status: 500 }
    );
  }
}