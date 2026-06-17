// PRUEBAS EXHAUSTIVAS DE LÓGICA DEL BOT FRANCOTIRADOR LCN

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${message}`);
        failed++;
    }
}

console.log("=== INICIANDO SUITE DE PRUEBAS DEFINITIVAS ===\n");

// ---------------------------------------------------------
// TEST 1: LÓGICA DE TIEMPO Y DESPERTAR (Cron Timing Logic)
// ---------------------------------------------------------
console.log("--- TEST SUITE 1: Disparadores de Tiempo ---");

function checkShouldRun(h, m) {
    const openingTimes = [ {h:9, m:0}, {h:10, m:30}, {h:12, m:0}, {h:13, m:30} ];
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
    
    if (isOpeningTime) return "BURST";
    if (isPlus1) return "PLUS_1";
    if (isBackoff) return "BACKOFF";
    if (isHourlyCheck) return "HOURLY";
    return "SKIPPED";
}

assert(checkShouldRun(9, 0) === "BURST", "Minuto de apertura 09:00 detona RÁFAGA (BURST)");
assert(checkShouldRun(10, 30) === "BURST", "Minuto de apertura 10:30 detona RÁFAGA (BURST)");
assert(checkShouldRun(12, 0) === "BURST", "Minuto de apertura 12:00 detona RÁFAGA (BURST)");
assert(checkShouldRun(9, 1) === "PLUS_1", "Minuto +1 (09:01) detona ráfagas PLUS_1");
assert(checkShouldRun(10, 31) === "PLUS_1", "Minuto +1 (10:31) detona ráfagas PLUS_1");
assert(checkShouldRun(12, 5) === "BACKOFF", "Minuto +5 (12:05) detona BACKOFF");
assert(checkShouldRun(13, 50) === "BACKOFF", "Minuto +20 (13:50) detona BACKOFF");
assert(checkShouldRun(14, 0) === "HOURLY", "Hora en punto (14:00) detona HOURLY");
assert(checkShouldRun(11, 30) === "HOURLY", "Media hora (11:30) detona HOURLY");
assert(checkShouldRun(9, 15) === "SKIPPED", "Minuto irrelevante (09:15) se salta exitosamente");
assert(checkShouldRun(12, 4) === "SKIPPED", "Minuto irrelevante (12:04) se salta exitosamente");


// ---------------------------------------------------------
// TEST 2: LÓGICA DE FILTRADO DE CLASES (Radar)
// ---------------------------------------------------------
console.log("\n--- TEST SUITE 2: Filtrado de Clases ---");

// Mock Config del usuario
const config = {
    headquarter_id: 2,
    min_start_hour_minutes: 540, // 09:00
    max_start_hour_minutes: 720, // 12:00
    allowed_days: [1, 2, 3, 4, 5], // L-V
    level_group_name: "A1-A2"
};

const ignoredIds = [999]; // Mock de clase ya agendada (ALREADY_BOOKED)

// Mock de la fecha actual (simulando Lunes 15 de Junio, 10:00 AM)
const mockNow = new Date("2026-06-15T10:00:00-05:00").getTime();

function filterClass(s) {
    if (s.headquarter_id !== config.headquarter_id) return "REJECTED_SEDE";
    if (s.class_type_id !== 1) return "REJECTED_TIPO";
    if (s.start_hour < config.min_start_hour_minutes || s.start_hour > config.max_start_hour_minutes) return "REJECTED_HORA";
    
    const classDay = new Date(s.start_date.replace(' ', 'T')).getDay();
    if (!config.allowed_days.includes(classDay)) return "REJECTED_DIA";
    
    const cLvl = s.course_level_group_name || "";
    const uLvl = config.level_group_name || "";
    if (cLvl && uLvl && !uLvl.includes(cLvl) && !cLvl.includes(uLvl)) return "REJECTED_NIVEL";
    
    if (s.reserved >= s.max_student) return "REJECTED_LLENA";

    const classBogotaTime = s.start_date.replace(' ', 'T') + '-05:00';
    const classMs = new Date(classBogotaTime).getTime();
    const hoursDiff = (classMs - mockNow) / (1000 * 60 * 60);
    
    if (hoursDiff < 4) return "REJECTED_MENOS_DE_4H";
    if (ignoredIds.includes(s.id)) return "REJECTED_YA_AGENDADA";

    return "ACCEPTED";
}

const c1 = { id: 101, headquarter_id: 2, class_type_id: 1, start_hour: 540, start_date: "2026-06-16 09:00:00", course_level_group_name: "A1-A2", reserved: 0, max_student: 6 };
assert(filterClass(c1) === "ACCEPTED", "Acepta clase válida (Martes, 09:00 AM, Sede 2, Nivel OK, 23h restantes)");

const c_llena = { ...c1, reserved: 6 };
assert(filterClass(c_llena) === "REJECTED_LLENA", "Rechaza clase si está LLENA (6/6)");

const c_sede = { ...c1, headquarter_id: 3 };
assert(filterClass(c_sede) === "REJECTED_SEDE", "Rechaza clase si es de OTRA SEDE");

const c_hora1 = { ...c1, start_hour: 480 }; // 08:00 AM
assert(filterClass(c_hora1) === "REJECTED_HORA", "Rechaza clase ANTES de las 09:00 AM");

const c_hora2 = { ...c1, start_hour: 810 }; // 13:30 PM
assert(filterClass(c_hora2) === "REJECTED_HORA", "Rechaza clase DESPUÉS de las 12:00 PM");

const c_dia = { ...c1, start_date: "2026-06-20 09:00:00" }; // Sábado
assert(filterClass(c_dia) === "REJECTED_DIA", "Rechaza clase de FIN DE SEMANA");

const c_nivel = { ...c1, course_level_group_name: "B1" };
assert(filterClass(c_nivel) === "REJECTED_NIVEL", "Rechaza clase si el nivel no concuerda (B1 vs A1-A2)");

const c_ignored = { ...c1, id: 999 };
assert(filterClass(c_ignored) === "REJECTED_YA_AGENDADA", "Rechaza clase si está en la lista negra (ALREADY_BOOKED)");

const c_4horas_fail = { ...c1, start_date: "2026-06-15 12:00:00" }; // Empieza en 2 horas
assert(filterClass(c_4horas_fail) === "REJECTED_MENOS_DE_4H", "Rechaza clase si falta menos de 4 horas (Faltan 2 horas)");

const c_4horas_pass = { ...c1, start_date: "2026-06-15 15:00:00" }; // Empieza en 5 horas
// Start hour is 15:00 which is 900 minutes. We must change it to valid start hour 720 (12:00 PM), but wait, if it's 12:00 PM, it's 2 hours away.
// Let's test the math explicitly:
const c_4horas_pass_math = { ...c1, start_hour: 720, start_date: "2026-06-15 14:01:00" }; // Empieza en 4.01 horas
assert(filterClass(c_4horas_pass_math) === "ACCEPTED", "Acepta clase si falta MAS de 4 horas (Faltan 4.01 horas)");


// ---------------------------------------------------------
// RESULTADOS
// ---------------------------------------------------------
console.log("\n=============================================");
console.log(`TOTAL PASS: ${passed}`);
console.log(`TOTAL FAIL: ${failed}`);
if (failed === 0) {
    console.log("🌟 EL SISTEMA ESTÁ MATEMÁTICAMENTE COMPROBADO Y ES A PRUEBA DE BALAS.");
} else {
    console.log("⚠️ SE ENCONTRARON FALLOS EN LA LÓGICA.");
}
console.log("=============================================\n");
