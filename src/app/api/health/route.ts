import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  const checks: {
    database: { status: string; latency_ms: number; detail: string };
    brute_force: { status: string; suspicious_ips: string[]; detail: string };
    storage: { status: string; detail: string };
  } = {
    database: { status: 'unknown', latency_ms: 0, detail: '' },
    brute_force: { status: 'ok', suspicious_ips: [], detail: 'No brute-force detected' },
    storage: { status: 'ok', detail: 'Supabase managed storage' },
  };

  // Use a mutable string to avoid TypeScript narrowing issues
  let overallStatus: string = 'ok';

  // --- 1. Database Connectivity Check ---
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const dbStart = Date.now();

    const { error } = await supabase
      .from('produk')
      .select('count', { count: 'exact', head: true });

    const dbLatency = Date.now() - dbStart;

    if (error) {
      checks.database = {
        status: 'error',
        latency_ms: dbLatency,
        detail: `Connection failed: ${error.message}`,
      };
      overallStatus = 'error';
    } else {
      checks.database = {
        status: 'ok',
        latency_ms: dbLatency,
        detail: `Connected to Supabase (${supabaseUrl.replace('https://', '').split('.')[0]})`,
      };
      if (dbLatency > 2000) {
        checks.database.status = 'degraded';
        if (overallStatus !== 'error') overallStatus = 'degraded';
      }
    }
  } catch (err: any) {
    checks.database = {
      status: 'error',
      latency_ms: Date.now() - startTime,
      detail: `Unexpected error: ${err?.message || 'Unknown'}`,
    };
    overallStatus = 'error';
  }

  // --- 2. Brute-Force Login Detection ---
  // Checks for > 10 failed logins within 5 minutes from the same IP
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: failedLogs, error: logError } = await supabase
      .from('audit_logs')
      .select('actor, details, timestamp')
      .eq('action', 'LOGIN_FAILED')
      .gte('timestamp', fiveMinutesAgo);

    if (logError) {
      checks.brute_force = {
        status: 'unknown',
        suspicious_ips: [],
        detail: 'Could not query audit_logs (table may not exist yet)',
      };
    } else if (failedLogs && failedLogs.length > 0) {
      // Group by actor (IP / email)
      const countByActor: Record<string, number> = {};
      failedLogs.forEach((log: any) => {
        const key = log.actor || 'unknown';
        countByActor[key] = (countByActor[key] || 0) + 1;
      });

      const suspiciousActors = Object.entries(countByActor)
        .filter(([, count]) => count > 10)
        .map(([actor]) => actor);

      if (suspiciousActors.length > 0) {
        checks.brute_force = {
          status: 'alert',
          suspicious_ips: suspiciousActors,
          detail: `BRUTE FORCE DETECTED: ${suspiciousActors.length} suspicious actor(s) with >10 failed logins in 5 minutes`,
        };
        overallStatus = overallStatus !== 'error' ? 'degraded' : 'error';
      } else {
        checks.brute_force = {
          status: 'ok',
          suspicious_ips: [],
          detail: `${failedLogs.length} failed login attempt(s) in last 5 min — below threshold`,
        };
      }
    } else {
      checks.brute_force = {
        status: 'ok',
        suspicious_ips: [],
        detail: 'No failed login attempts in the last 5 minutes',
      };
    }
  } catch (err: any) {
    checks.brute_force = {
      status: 'unknown',
      suspicious_ips: [],
      detail: `Brute-force check skipped: ${err?.message || 'Unknown error'}`,
    };
  }

  const totalLatency = Date.now() - startTime;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      total_latency_ms: totalLatency,
      version: '1.0.0',
      checks,
    },
    {
      status: overallStatus === 'error' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
