import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = "https://aifkamlnlakaxlozypys.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZmthbWxubGFrYXhsb3p5cHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MjM1MzcsImV4cCI6MjA5NzE5OTUzN30.0UE75qvlUloAiypHp_gw4m_aOVe5vB5msqui9jLrlMw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log("1. Activando manualmente la Edge Function (Simulando el Cron)...");
  
  const res = await fetch("https://aifkamlnlakaxlozypys.supabase.co/functions/v1/auto-book", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  
  const text = await res.text();
  console.log("Respuesta del servidor:", text);
  
  console.log("\n2. Leyendo los últimos 5 registros de la base de datos (booking_logs)...");
  const { data, error } = await supabase
    .from('booking_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error("Error leyendo DB:", error);
  } else {
    data.reverse().forEach(log => {
      console.log(`[${new Date(log.created_at).toLocaleTimeString()}] ${log.status}: ${log.message}`);
    });
  }
}

run();
