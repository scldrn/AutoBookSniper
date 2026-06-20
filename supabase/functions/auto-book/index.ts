import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const logInfo = async (msg: string, details?: any) => {
      console.log(msg);
      await supabase.from('booking_logs').insert({ status: 'INFO', message: msg, details });
    };

    const logSuccess = async (msg: string, schedId: number, details?: any) => {
      console.log(`SUCCESS: ${msg}`);
      await supabase.from('booking_logs').insert({ status: 'SUCCESS', message: msg, schedule_id: schedId, details });
    };

    const logFailed = async (msg: string, schedId?: number, details?: any) => {
      console.error(`FAILED: ${msg}`);
      await supabase.from('booking_logs').insert({ status: 'FAILED', message: msg, schedule_id: schedId, details });
    };

    const nowBogota = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
    const h = nowBogota.getHours();
    const m = nowBogota.getMinutes();

    const openingTimes = [ 
        { h: 7, m: 30 },   // Weekday Early
        { h: 8, m: 15 },   // Saturday
        { h: 9, m: 0 },    // Weekday
        { h: 9, m: 45 },   // Saturday
        { h: 10, m: 30 },  // Weekday
        { h: 11, m: 15 },  // Saturday
        { h: 12, m: 0 },   // Weekday
        { h: 13, m: 30 }   // Weekday
    ];
    const isOpeningTime = openingTimes.some(t => t.h === h && t.m === m);
    const isPlus1 = openingTimes.some(t => {
        let dh = t.h; let dm = t.m + 1;
        if (dm >= 60) { dm -= 60; dh += 1; }
        return dh === h && dm === m;
    });
    const isBackoff = openingTimes.some(t => {
        return [2, 3, 5, 10, 20].some(offset => {
            let dh = t.h; let dm = t.m + offset;
            if (dm >= 60) { dm -= 60; dh += 1; }
            return dh === h && dm === m;
        });
    });
    const isHourlyCheck = (m === 0 || m === 30);

    if (!isOpeningTime && !isPlus1 && !isBackoff && !isHourlyCheck) {
        return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    await logInfo('=== Starting Auto-Book Sweep ===');

    const lcnEmail = Deno.env.get('LCN_EMAIL');
    const lcnPassword = Deno.env.get('LCN_PASSWORD');

    if (!lcnEmail || !lcnPassword) {
      const err = "LCN_EMAIL or LCN_PASSWORD secrets are missing.";
      await logFailed(err);
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }

    await logInfo('Authenticating with LCN API...');
    let xsrfToken = '';
    let cookieString = '';

    const csrfRes = await fetch('https://api.lcnidiomas.edu.co/sanctum/csrf-cookie', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://usuarios.lcnidiomas.edu.co',
        'Referer': 'https://usuarios.lcnidiomas.edu.co/'
      }
    });

    const csrfCookies = csrfRes.headers.get('set-cookie');
    if (csrfCookies) {
      const cookies = csrfCookies.split(',').map(c => c.split(';')[0].trim());
      cookies.forEach(c => {
        cookieString += `${c}; `;
        if (c.startsWith('XSRF-TOKEN=')) {
          xsrfToken = decodeURIComponent(c.replace('XSRF-TOKEN=', ''));
        }
      });
    }

    const loginRes = await fetch('https://api.lcnidiomas.edu.co/api/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cookie': cookieString,
        'X-XSRF-TOKEN': xsrfToken,
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://usuarios.lcnidiomas.edu.co',
        'Referer': 'https://usuarios.lcnidiomas.edu.co/'
      },
      body: JSON.stringify({ email: lcnEmail, password: lcnPassword })
    });

    if (!loginRes.ok) {
      const err = `Login failed with status ${loginRes.status}`;
      await logFailed(err);
      return new Response(JSON.stringify({ error: err }), { status: 401 });
    }

    const loginCookies = loginRes.headers.get('set-cookie');
    if (loginCookies) {
      const cookies = loginCookies.split(',').map(c => c.split(';')[0].trim());
      cookies.forEach(c => {
        const cName = c.split('=')[0];
        const regex = new RegExp(`${cName}=[^;]+(?:;\\s*|$)`, 'g');
        if (cookieString.match(regex)) {
          cookieString = cookieString.replace(regex, `${c}; `);
        } else {
          cookieString += `${c}; `;
        }
        if (c.startsWith('XSRF-TOKEN=')) {
          xsrfToken = decodeURIComponent(c.replace('XSRF-TOKEN=', ''));
        }
      });
    }

    const lcnHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cookie': cookieString,
      'X-XSRF-TOKEN': xsrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://usuarios.lcnidiomas.edu.co',
      'Referer': 'https://usuarios.lcnidiomas.edu.co/'
    };

    const { data: configs, error: configError } = await supabase
      .from('student_config')
      .select('*')
      .limit(1);

    if (configError || !configs || configs.length === 0) {
      return new Response(JSON.stringify({ error: "No student config found" }), { status: 400 });
    }

    const config = configs[0];
    const { enrollment_id, third_party_id, headquarter_id, min_start_hour_minutes, max_start_hour_minutes, allowed_days } = config;

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    
    const today = new Date(nowBogota.getTime());
    const startDateStr = formatDate(today);
    
    const endDate = new Date(nowBogota.getTime());
    endDate.setDate(endDate.getDate() + 3); // LCN API end_date is exclusive, add 3 to include the 3rd day
    const endDateStr = formatDate(endDate);

    const { data: logs } = await supabase.from('booking_logs').select('schedule_id').in('status', ['SUCCESS', 'ALREADY_BOOKED']);
    const ignoredIds = logs ? logs.map((l: any) => l.schedule_id) : [];

    const attemptSweep = async (attemptName: string) => {
      await logInfo(`[${attemptName}] Scanning from ${startDateStr} to ${endDateStr}...`);
      const matches: any[] = [];
      const boardUrl = `https://api.lcnidiomas.edu.co/api/schedules/between-dates/${headquarter_id}/70/${startDateStr}/${endDateStr}?teachers=[]`;
      const boardRes = await fetch(boardUrl, {
        method: "GET", headers: lcnHeaders
      });

      if (!boardRes.ok) return 0;
      const boardData = await boardRes.json();
      const classes = boardData.data || [];

      for (const s of classes) {
        if (s.headquarter_id !== headquarter_id) continue;
        if (s.class_type_id !== 1) continue;
        if (s.start_hour < min_start_hour_minutes || s.start_hour > max_start_hour_minutes) continue;
        
        const classDay = new Date(s.start_date.replace(' ', 'T')).getDay();
        if (!allowed_days.includes(classDay)) continue;
        
        const cLvl = s.course_level_group_name || "";
        const uLvl = config.level_group_name || "";
        if (cLvl && uLvl && !uLvl.includes(cLvl) && !cLvl.includes(uLvl)) continue;
        
        if (s.reserved >= s.max_student) continue;

        // --- HARD FIREWALL: Evitar multas por clases canceladas manualmente ---
        // Bloqueamos absolutamente cualquier clase en estas fechas y horas canceladas por el usuario.
        if (
            (s.start_date.includes('2026-06-18') && s.start_hour === 450) || // Jueves 18 @ 7:30 AM
            (s.start_date.includes('2026-06-19') && s.start_hour === 450)    // Viernes 19 @ 7:30 AM
        ) {
            continue;
        }

        // 4 hour limit check
        const classBogotaTime = s.start_date.replace(' ', 'T') + '-05:00';
        const classMs = new Date(classBogotaTime).getTime();
        const nowMs = Date.now();
        const hoursDiff = (classMs - nowMs) / (1000 * 60 * 60);
        if (hoursDiff < 4) {
            continue;
        }

        if (ignoredIds.includes(s.id)) continue;

        matches.push(s);
      }

      let bookedCount = 0;
      for (const item of matches) {
        await logInfo(`[${attemptName}] Found slot! Attempting booking Class ID ${item.id} (${item.start_date})...`);
        item.third_party_id = third_party_id;
        item.enrollment_id = enrollment_id;
        try {
          const bookRes = await fetch(`https://api.lcnidiomas.edu.co/api/schedules/store-class-schedule/48`, {
            method: "POST", headers: lcnHeaders, body: JSON.stringify(item)
          });
          const resBody = await bookRes.json();
          if (bookRes.ok && (resBody.success || resBody.data)) {
            await logSuccess(`[${attemptName}] Successfully booked Class ID ${item.id} for ${item.start_date}`, item.id, resBody);
            bookedCount++;
            // We removed the break so it books all available classes!
          } else {
            const msgStr = (resBody.message || "").toLowerCase();
            const alreadyBooked = msgStr.includes("ya") || msgStr.includes("cruz") || msgStr.includes("asignad") || msgStr.includes("registrad") || msgStr.includes("tienes");
            if (alreadyBooked) {
                await supabase.from('booking_logs').insert({ status: 'ALREADY_BOOKED', message: resBody.message, schedule_id: item.id });
                ignoredIds.push(item.id); // Add to memory so we skip in subsequent sweeps
            } else {
                await logFailed(`[${attemptName}] Failed booking Class ID ${item.id}`, item.id, resBody);
            }
          }
        } catch (err) {
          await logFailed(`[${attemptName}] Network error booking Class ID ${item.id}: ${err.message}`, item.id);
        }
      }
      return bookedCount;
    };

    let totalBooked = 0;

    if (isOpeningTime) {
      await logInfo(`*** SUPER BURST MODE ACTIVATED *** Classes open right now!`);
      totalBooked += await attemptSweep('0s');
      if (totalBooked === 0) { await new Promise(r => setTimeout(r, 10000)); totalBooked += await attemptSweep('10s'); }
      if (totalBooked === 0) { await new Promise(r => setTimeout(r, 10000)); totalBooked += await attemptSweep('20s'); }
      if (totalBooked === 0) { await new Promise(r => setTimeout(r, 10000)); totalBooked += await attemptSweep('30s'); }
      if (totalBooked === 0) { await new Promise(r => setTimeout(r, 10000)); totalBooked += await attemptSweep('40s'); }
      if (totalBooked === 0) { await new Promise(r => setTimeout(r, 10000)); totalBooked += await attemptSweep('50s'); }
    } else if (isPlus1) {
      totalBooked += await attemptSweep('1m 0s');
      if (totalBooked === 0) { await new Promise(r => setTimeout(r, 30000)); totalBooked += await attemptSweep('1m 30s'); }
    } else {
      totalBooked += await attemptSweep('Backoff/Hourly sweep');
    }

    return new Response(JSON.stringify({ success: true, booked: totalBooked }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
})
