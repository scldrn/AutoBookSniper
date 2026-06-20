-- ==============================================================================
-- SCRIPT DEFINITIVO DE CONFIGURACIÓN DEL BOT FRANCOTIRADOR LCN
-- ==============================================================================

-- 1. ACTUALIZAR LAS PREFERENCIAS DE ESTUDIO
-- Esto configura el radar del bot para buscar solo lo que te interesa.
UPDATE student_config 
SET 
    min_start_hour_minutes = 540, -- Desde las 09:00 AM
    max_start_hour_minutes = 720, -- Hasta la clase de 12:00 PM (que termina a las 1:30 PM)
    allowed_days = ARRAY[1, 2, 3, 4, 5] -- Lunes a Viernes
WHERE headquarter_id = 2; -- Aplica a Sede Unicentro

-- 2. LIMPIAR CUALQUIER TAREA DE FONDO ANTERIOR
-- Esto evita que queden versiones viejas del cron corriendo en conflicto.
SELECT cron.unschedule('lcn-auto-book-sweep');

-- 3. ACTIVAR EL MOTOR DE ASEDIO (CRON JOB)
-- El bot despertará religiosamente cada 1 minuto de lunes a viernes,
-- 3. Programar el Despertador (Cron Job) cada minuto de Lunes a Sábado
SELECT cron.unschedule('lcn-auto-book-sweep');

SELECT cron.schedule(
    'lcn-auto-book-sweep',
    '* * * * 1-6',  
    $$
    SELECT net.http_post(
        url:='https://aifkamlnlakaxlozypys.supabase.co/functions/v1/auto-book',
        headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZmthbWxubGFrYXhsb3p5cHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MjM1MzcsImV4cCI6MjA5NzE5OTUzN30.0UE75qvlUloAiypHp_gw4m_aOVe5vB5msqui9jLrlMw"}'::jsonb
    );
    $$
);
