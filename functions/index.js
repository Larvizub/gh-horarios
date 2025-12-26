const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const qs = require("qs");
const { startOfWeek, addWeeks, getISOWeek, getYear, format, addDays, getDay } = require("date-fns");
const { es } = require("date-fns/locale");

admin.initializeApp();
const db = admin.database();

// --- CONFIGURACIÓN ---
// Estas deben configurarse vía firebase functions:config:set graph.client_id="..." graph.client_secret="..." graph.tenant_id="..."
// Para pruebas locales, puedes codificarlas o usar .env
const GRAPH_CLIENT_ID = functions.config().graph?.client_id || "YOUR_CLIENT_ID";
const GRAPH_CLIENT_SECRET = functions.config().graph?.client_secret || "YOUR_CLIENT_SECRET";
const GRAPH_TENANT_ID = functions.config().graph?.tenant_id || "YOUR_TENANT_ID";
const SENDER_EMAIL = functions.config().email?.sender || "notifications@yourdomain.com";

// --- CONSTANTES ---
const NO_SUMAN_HORAS = [
  "descanso", "vacaciones", "feriado", "permiso", "dia-brigada", 
  "fuera-oficina", "incapacidad-enfermedad", "incapacidad-accidente"
];

const HORAS_MAXIMAS = {
  "Operativo": 48,
  "Confianza": 72
};

// --- AYUDANTES ---

/**
 * Obtener Token de Acceso de Microsoft Graph API
 */
async function getGraphAccessToken() {
  const tokenEndpoint = `https://login.microsoftonline.com/${GRAPH_TENANT_ID}/oauth2/v2.0/token`;
  const data = {
    client_id: GRAPH_CLIENT_ID,
    scope: "https://graph.microsoft.com/.default",
    client_secret: GRAPH_CLIENT_SECRET,
    grant_type: "client_credentials",
  };

  try {
    const response = await axios.post(tokenEndpoint, qs.stringify(data), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting Graph access token:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Enviar Correo vía Microsoft Graph API
 */
async function sendEmail(toRecipients, subject, htmlContent) {
  if (!toRecipients || toRecipients.length === 0) {
    console.log("No recipients for email:", subject);
    return;
  }

  const token = await getGraphAccessToken();
  const endpoint = `https://graph.microsoft.com/v1.0/users/${SENDER_EMAIL}/sendMail`;

  const emailData = {
    message: {
      subject: subject,
      body: {
        contentType: "HTML",
        content: htmlContent,
      },
      toRecipients: toRecipients.map((email) => ({
        emailAddress: { address: email },
      })),
    },
    saveToSentItems: false,
  };

  try {
    await axios.post(endpoint, emailData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`Email sent to ${toRecipients.length} recipients. Subject: ${subject}`);
  } catch (error) {
    console.error("Error sending email:", error.response?.data || error.message);
    // No lanzar error, solo registrar, para que otros correos puedan proceder
  }
}

/**
 * Obtener Clave de Semana (YYYY-WW)
 */
function getWeekKey(date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const year = getYear(start);
  const week = getISOWeek(start);
  return `${year}-${week}`;
}

/**
 * Obtener Clave de Día (dia1..dia7)
 * Lunes = dia1, Domingo = dia7
 */
function getDayKey(date) {
  const day = getDay(date); // 0 = Domingo, 1 = Lunes
  const adjustedDay = day === 0 ? 7 : day;
  return `dia${adjustedDay}`;
}

/**
 * Obtener todos los usuarios
 */
async function getAllUsers() {
  const snapshot = await db.ref("usuarios").once("value");
  return snapshot.val() || {};
}

/**
 * Obtener horarios para una semana específica
 */
async function getSchedulesForWeek(weekKey) {
  const snapshot = await db.ref(`horarios_registros/${weekKey}`).once("value");
  return snapshot.val() || {};
}

// --- PLANTILLAS ---

// Plantillas de email y estilos
// Usamos logo remoto via LOGO_URL. No se incluye base64 embebido.
const baseStyles = `
  body { background-color: #f0f2f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #333; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .header { background: #00830e; padding: 32px 20px; text-align: center; position: relative; }
  .logo-container { background: #ffffff; width: 80px; height: 80px; border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  .logo { width: 64px; height: 64px; object-fit: contain; }
  .app-title { color: #ffffff; font-size: 22px; font-weight: 600; margin: 0; letter-spacing: 0.5px; }
  .sub-title { color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px; }
  .content { padding: 32px; font-size: 15px; line-height: 1.6; color: #444; }
  .footer { background: #f8f9fa; padding: 24px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
  
  /* Card Styles */
  .card { background: #f8f9fa; border-left: 4px solid #00830e; padding: 16px; margin: 16px 0; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .tag { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }
  .tag-teletrabajo { background: #2e7d32; }
  .tag-fuera { background: #757575; }
  .tag-vacaciones { background: #0288d1; }
  
  /* Table Styles */
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
  th { background: #f1f3f5; color: #555; font-weight: 600; text-align: left; padding: 10px; border-bottom: 2px solid #e9ecef; }
  td { padding: 10px; border-bottom: 1px solid #eee; color: #333; }
  tr:last-child td { border-bottom: none; }
  
  /* Typography */
  h1, h2, h3 { color: #1a1a1a; margin-top: 0; }
  p { margin-bottom: 16px; }
  strong { color: #00830e; }

  /* Schedule Card Styles */
  .user-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
  .user-header { font-size: 15px; font-weight: 700; color: #00830e; margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px; }
  .schedule-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .day-item { display: flex; flex-direction: column; align-items: center; text-align: center; background: #f8f9fa; padding: 8px 4px; border-radius: 6px; border: 1px solid #eee; }
  .day-label { font-size: 10px; font-weight: 700; color: #888; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .day-value { font-size: 11px; color: #333; font-weight: 600; line-height: 1.3; }
  
  @media (max-width: 480px) { 
    .schedule-grid { grid-template-columns: 1fr; gap: 4px; } 
    .day-item { flex-direction: row; justify-content: space-between; padding: 8px 12px; text-align: left; } 
    .day-label { margin-bottom: 0; font-size: 11px; }
    .day-value { font-size: 12px; }
  }
`;

// Remote logo URL (preferred). Falls back to embedded base64 if needed.
const LOGO_URL = 'https://costaricacc.com/cccr/Logocccr.png';

function createEmailTemplate(title, content) {
  // Use remote logo (LOGO_URL) — no embedded base64 fallback
  const logoSrc = LOGO_URL;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
            <img src="${logoSrc}" alt="Logo" class="logo" />
          </div>
          <h1 class="app-title">${title}</h1>
          <p class="sub-title">Sistema de Horarios — Notificación Automática</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p style="margin:0 0 8px 0;">Este es un mensaje automático del Sistema de Horarios.</p>
          <p style="margin:0;color:#aaa;">© ${new Date().getFullYear()} Costa Rica Contact Center</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// --- FUNCIONES ---

/**
 * 1. Recordatorio Diario: Quién está fuera de oficina y en teletrabajo hoy.
 * Se ejecuta cada día laborable a las 8:00 AM.
 */
exports.dailyStatusReminder = functions.pubsub.schedule("0 8 * * 1-5")
  .timeZone("America/Guatemala") // Ajustar zona horaria según sea necesario
  .onRun(async (context) => {
    const today = new Date();
    const weekKey = getWeekKey(today);
    const dayKey = getDayKey(today);
    const dateStr = format(today, "EEEE d 'de' MMMM", { locale: es });

    console.log(`Running dailyStatusReminder for ${dateStr} (${weekKey}/${dayKey})`);

    const [users, schedules] = await Promise.all([
      getAllUsers(),
      getSchedulesForWeek(weekKey),
    ]);

    const teletrabajo = [];
    const fueraOficina = [];

    Object.entries(schedules).forEach(([userId, userSchedule]) => {
      const scheduleEntry = userSchedule[dayKey];
      const scheduleType = scheduleEntry?.tipo;
      const user = users[userId];

      if (user && scheduleType) {
        if (scheduleType === "teletrabajo" || scheduleType === "tele-presencial") {
          teletrabajo.push(user);
        } else if (
          ["vacaciones", "incapacidad-enfermedad", "incapacidad-accidente", "permiso", "fuera-oficina", "dia-brigada"].includes(scheduleType)
        ) {
          fueraOficina.push({ user, type: scheduleType });
        }
      }
    });

    if (teletrabajo.length === 0 && fueraOficina.length === 0) {
      console.log("No special statuses today.");
      return null;
    }

    let htmlContent = `<p>Resumen de estados para hoy, <strong>${dateStr}</strong>:</p>`;

    if (teletrabajo.length > 0) {
      htmlContent += `<h3>🏠 Teletrabajo</h3>`;
      teletrabajo.forEach(u => {
        htmlContent += `<div class="card"><strong>${u.nombre} ${u.apellidos}</strong> <span class="tag tag-teletrabajo">Teletrabajo</span></div>`;
      });
    }

    if (fueraOficina.length > 0) {
      htmlContent += `<h3>🚫 Fuera de Oficina</h3>`;
      fueraOficina.forEach(item => {
        const label = item.type.replace(/-/g, " ").toUpperCase();
        htmlContent += `<div class="card" style="border-left-color: #757575;"><strong>${item.user.nombre} ${item.user.apellidos}</strong> <span class="tag tag-fuera">${label}</span></div>`;
      });
    }

    const finalHtml = createEmailTemplate("Estado del Personal - Hoy", htmlContent);
    
    // Enviar a todos los usuarios activos
    const allEmails = Object.values(users)
      .filter(u => u.email) // Agregar lógica para filtrar usuarios activos si es necesario
      .map(u => u.email);

    // Envío por lotes si hay demasiados destinatarios (límites de Graph API)
    // Por simplicidad, enviando a todos a la vez (el límite suele ser 500 por mensaje)
    await sendEmail(allEmails, `Estado del Personal - ${dateStr}`, finalHtml);

    return null;
  });

/**
 * 2. Recordatorio de Vacaciones: Notificar a los departamentos sobre próximas vacaciones (1 día antes).
 * Se ejecuta diariamente a las 9:00 AM.
 */
exports.vacationReminder = functions.pubsub.schedule("0 9 * * *")
  .timeZone("America/Guatemala")
  .onRun(async (context) => {
    const tomorrow = addDays(new Date(), 1);
    const weekKey = getWeekKey(tomorrow);
    const dayKey = getDayKey(tomorrow);
    const dateStr = format(tomorrow, "EEEE d 'de' MMMM", { locale: es });

    console.log(`Running vacationReminder for ${dateStr}`);

    const [users, schedules] = await Promise.all([
      getAllUsers(),
      getSchedulesForWeek(weekKey),
    ]);

    const vacationsByDept = {};

    Object.entries(schedules).forEach(([userId, userSchedule]) => {
      const scheduleEntry = userSchedule[dayKey];
      const scheduleType = scheduleEntry?.tipo;
      const user = users[userId];

      if (user && scheduleType === "vacaciones") {
        const dept = user.departamento;
        if (dept) {
          if (!vacationsByDept[dept]) vacationsByDept[dept] = [];
          vacationsByDept[dept].push(user);
        }
      }
    });

    const promises = Object.entries(vacationsByDept).map(async ([dept, vacationUsers]) => {
      // Buscar correos de usuarios en este departamento
      const deptEmails = Object.values(users)
        .filter(u => u.departamento === dept && u.email)
        .map(u => u.email);

      if (deptEmails.length === 0) return;

      let htmlContent = `<p>El personal del departamento <strong>${dept}</strong> que saldrá de vacaciones mañana <strong>${dateStr}</strong>:</p>`;
      vacationUsers.forEach(u => {
        htmlContent += `<div class="card" style="border-left-color: #0288d1;"><strong>${u.nombre} ${u.apellidos}</strong> <span class="tag tag-vacaciones">Vacaciones</span></div>`;
      });

      const finalHtml = createEmailTemplate(`Recordatorio de Vacaciones - ${dept}`, htmlContent);
      await sendEmail(deptEmails, `Recordatorio de Vacaciones: ${dept}`, finalHtml);
    });

    await Promise.all(promises);
    return null;
  });

/**
 * 3. Resumen Semanal de Horarios: Enviar horario de la próxima semana cada viernes a las 16:00.
 */
exports.weeklyScheduleSummary = functions.pubsub.schedule("0 16 * * 5")
  .timeZone("America/Guatemala")
  .onRun(async (context) => {
    const today = new Date();
    const nextWeekStart = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1);
    const weekKey = getWeekKey(nextWeekStart);
    const weekLabel = `Semana del ${format(nextWeekStart, "d 'de' MMMM", { locale: es })}`;

    console.log(`Running weeklyScheduleSummary for ${weekKey}`);

    const [users, schedules] = await Promise.all([
      getAllUsers(),
      getSchedulesForWeek(weekKey),
    ]);

    if (Object.keys(schedules).length === 0) {
      console.log("No schedules found for next week.");
      return null;
    }

    // Agrupar por departamento para mejor legibilidad
    const schedulesByDept = {};
    
    // Inicializar departamentos
    Object.values(users).forEach(u => {
      if (u.departamento && !schedulesByDept[u.departamento]) {
        schedulesByDept[u.departamento] = [];
      }
    });

    Object.entries(schedules).forEach(([userId, userSchedule]) => {
      const user = users[userId];
      if (user && user.departamento) {
        if (!schedulesByDept[user.departamento]) schedulesByDept[user.departamento] = [];
        schedulesByDept[user.departamento].push({ user, schedule: userSchedule });
      }
    });

    let htmlContent = `<p>A continuación se presenta el resumen de horarios para la <strong>${weekLabel}</strong>.</p>`;

    // Ordenar departamentos
    const sortedDepts = Object.keys(schedulesByDept).sort();

    sortedDepts.forEach(dept => {
      const deptSchedules = schedulesByDept[dept];
      if (deptSchedules.length === 0) return;

      htmlContent += `<h3 style="margin-top:24px;margin-bottom:12px;color:#444;border-left:4px solid #00830e;padding-left:10px;">${dept}</h3>`;

      deptSchedules.forEach(({ user, schedule }) => {
        htmlContent += `<div class="user-card">
          <div class="user-header">${user.nombre} ${user.apellidos}</div>
          <div class="schedule-grid">`;
          
        // Days 1 to 5 (Mon-Fri)
        for (let i = 1; i <= 5; i++) {
           const dayKey = `dia${i}`;
           const dayLabel = DIAS_LABELS[dayKey].substring(0, 3);
           const val = formatSchedule(schedule[dayKey]);
           htmlContent += `
             <div class="day-item">
               <span class="day-label">${dayLabel}</span>
               <span class="day-value">${val}</span>
             </div>`;
        }
        
        htmlContent += `</div></div>`;
      });
    });

    const finalHtml = createEmailTemplate(`Resumen de Horarios - ${weekLabel}`, htmlContent);

    const allEmails = Object.values(users)
      .filter(u => u.email)
      .map(u => u.email);

    await sendEmail(allEmails, `Resumen de Horarios: ${weekLabel}`, finalHtml);
    return null;
  });

/**
 * 4. Verificación de Cumplimiento de Horario: Notificar a usuarios sobre exceso de horas o descanso insuficiente.
 * Se ejecuta los viernes a las 16:30 (poco después del resumen).
 */
exports.scheduleComplianceCheck = functions.pubsub.schedule("30 16 * * 5")
  .timeZone("America/Guatemala")
  .onRun(async (context) => {
    const today = new Date();
    const nextWeekStart = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1);
    const weekKey = getWeekKey(nextWeekStart);
    const weekLabel = `Semana del ${format(nextWeekStart, "d 'de' MMMM", { locale: es })}`;

    console.log(`Running scheduleComplianceCheck for ${weekKey}`);

    const [users, schedules] = await Promise.all([
      getAllUsers(),
      getSchedulesForWeek(weekKey),
    ]);

    const promises = Object.entries(schedules).map(async ([userId, userSchedule]) => {
      const user = users[userId];
      if (!user || !user.email) return;

      const issues = [];
      let totalHours = 0;
      const dailyIntervals = [];

      // 1. Calcular Horas Totales y Recolectar Intervalos
      for (let i = 1; i <= 7; i++) {
        const dayKey = `dia${i}`;
        const entry = userSchedule[dayKey];

        if (!entry) continue;

        // Manejar estructura de objeto (esperado) o cadena (antiguo/simple)
        const tipo = typeof entry === "object" ? entry.tipo : entry;
        const horas = typeof entry === "object" ? (entry.horas || 0) : 0;
        const horaInicio = typeof entry === "object" ? entry.horaInicio : null;
        const horaFin = typeof entry === "object" ? entry.horaFin : null;

        if (!NO_SUMAN_HORAS.includes(tipo)) {
          totalHours += horas;
        }

        // Almacenar intervalo para verificación de descanso si es un turno laboral con horas
        if (horaInicio && horaFin && !NO_SUMAN_HORAS.includes(tipo)) {
          dailyIntervals.push({
            dayIndex: i,
            start: horaInicio,
            end: horaFin
          });
        }
      }

      // 2. Verificar Horas Máximas
      const tipoContrato = user.tipoContrato || "Operativo";
      const maxHours = HORAS_MAXIMAS[tipoContrato] || 48;

      if (totalHours > maxHours) {
        issues.push({
          type: "excess_hours",
          message: `Has excedido el límite de horas semanales. Tienes <strong>${totalHours}</strong> horas asignadas (Límite: ${maxHours}h).`
        });
      }

      // 3. Verificar Descanso (12 horas entre turnos)
      // Ordenar por índice de día por si acaso
      dailyIntervals.sort((a, b) => a.dayIndex - b.dayIndex);

      for (let i = 0; i < dailyIntervals.length - 1; i++) {
        const current = dailyIntervals[i];
        const next = dailyIntervals[i + 1];

        // Solo verificar días consecutivos o el mismo día (si hay múltiples turnos, aunque la estructura implica 1 por día)
        // Si el siguiente es día+1
        if (next.dayIndex === current.dayIndex + 1) {
          // Calcular fin del actual (horas absolutas desde Lunes 00:00)
          const [h1, m1] = current.end.split(":").map(Number);
          const [hStart, mStart] = current.start.split(":").map(Number);
          
          let endAbs = (current.dayIndex - 1) * 24 + h1 + m1 / 60;
          // Manejar turno nocturno: si fin < inicio, sumar 24h
          const startAbsLocal = (current.dayIndex - 1) * 24 + hStart + mStart / 60;
          if (endAbs < startAbsLocal) {
            endAbs += 24;
          }

          // Calcular inicio del siguiente
          const [h2, m2] = next.start.split(":").map(Number);
          const startNextAbs = (next.dayIndex - 1) * 24 + h2 + m2 / 60;

          const restHours = startNextAbs - endAbs;

          if (restHours < 12) {
            issues.push({
              type: "insufficient_rest",
              message: `Descanso insuficiente entre ${DIAS_LABELS[`dia${current.dayIndex}`]} y ${DIAS_LABELS[`dia${next.dayIndex}`]}. Tienes solo <strong>${restHours.toFixed(1)}</strong> horas de descanso (Mínimo: 12h).`
            });
          }
        }
      }

      if (issues.length > 0) {
        let htmlContent = `<p>Se han detectado las siguientes observaciones en tu horario para la <strong>${weekLabel}</strong>:</p>`;
        
        issues.forEach(issue => {
          const color = issue.type === "excess_hours" ? "#d32f2f" : "#f57c00";
          htmlContent += `<div class="card" style="border-left-color: ${color};">
            ${issue.message}
          </div>`;
        });

        htmlContent += `<p>Por favor, contacta a tu supervisor o al departamento de Talento Humano si consideras que esto es un error.</p>`;

        const finalHtml = createEmailTemplate(`Aviso de Horario - ${weekLabel}`, htmlContent);
        await sendEmail([user.email], `Aviso Importante: Tu Horario ${weekLabel}`, finalHtml);
      }
    });

    await Promise.all(promises);
    return null;
  });

const DIAS_LABELS = {
  dia1: 'Lunes',
  dia2: 'Martes',
  dia3: 'Miércoles',
  dia4: 'Jueves',
  dia5: 'Viernes',
  dia6: 'Sábado',
  dia7: 'Domingo'
};

function formatSchedule(val) {
  if (!val) return "-";
  
  const entry = typeof val === 'object' ? val : { tipo: val };
  const { tipo, horaInicio, horaFin } = entry;

  // Mapear códigos a etiquetas cortas
  const map = {
    "teletrabajo": "🏠 Teletrabajo",
    "tele-presencial": "🏢/🏠 Híbrido",
    "vacaciones": "🏖️ Vacaciones",
    "descanso": "💤 Descanso",
    "feriado": "📅 Feriado",
    "permiso": "✋ Permiso",
    "incapacidad-enfermedad": "🏥 Incapacidad",
    "fuera-oficina": "🚫 Fuera Oficina",
    "dia-brigada": "⛑️ Brigada"
  };

  // Si es un rango de tiempo (ej. "08:00-17:00"), mostrarlo
  if (horaInicio && horaFin && !["descanso", "vacaciones", "feriado", "incapacidad-enfermedad", "incapacidad-accidente"].includes(tipo)) {
     return `${horaInicio} - ${horaFin}`;
  }

  return map[tipo] || tipo || "-";
}

// 5. Notificación de Nuevo Usuario: Notificar a administradores cuando se crea un nuevo usuario.
exports.notifyNewUser = functions.database.ref("/usuarios/{uid}")
  .onCreate(async (snapshot, context) => {
    const newUser = snapshot.val();
    const uid = context.params.uid;

    if (!newUser) return null;

    console.log(`New user created: ${newUser.nombre} ${newUser.apellidos} (${uid})`);

    // Obtener todos los usuarios para encontrar administradores
    const allUsers = await getAllUsers();
    
    // Filtrar administradores con correo
    const adminEmails = Object.values(allUsers)
      .filter(u => u.rol === "Administrador" && u.email)
      .map(u => u.email);

    if (adminEmails.length === 0) {
      console.log("No administrators found to notify.");
      return null;
    }

    const htmlContent = `
      <p>Se ha registrado un nuevo usuario en la plataforma:</p>
      <div class="card">
        <p><strong>Nombre:</strong> ${newUser.nombre} ${newUser.apellidos}</p>
        <p><strong>Email:</strong> ${newUser.email}</p>
        <p><strong>Departamento:</strong> ${newUser.departamento || "No asignado"}</p>
        <p><strong>Rol:</strong> ${newUser.rol || "No asignado"}</p>
        <p><strong>Tipo de Contrato:</strong> ${newUser.tipoContrato || "No asignado"}</p>
      </div>
      <p>Por favor, verifica sus permisos y configuración en el panel de administración.</p>
    `;

    const finalHtml = createEmailTemplate("Nuevo Usuario Registrado", htmlContent);

    await sendEmail(adminEmails, "Nuevo Usuario en Plataforma de Horarios", finalHtml);
    return null;
  });

/**
 * 5. Enviar contraseñas por departamento a todos los usuarios.
 * Función HTTPS Callable para ser invocada desde el frontend.
 */
exports.sendPasswordsToAllUsers = functions.https.onCall(async (data, context) => {
  // Verificar que el usuario esté autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Debes estar autenticado para realizar esta acción.");
  }

  // Verificar que el usuario sea administrador
  const userSnapshot = await db.ref(`usuarios/${context.auth.uid}`).once("value");
  const userData = userSnapshot.val();
  if (!userData || userData.rol !== "Administrador") {
    throw new functions.https.HttpsError("permission-denied", "Solo los administradores pueden enviar contraseñas.");
  }

  const users = await getAllUsers();
  const passwordMap = {
    "Planeación de Eventos": "Planeacion2026",
    "Gestión de la Protección": "Seguridad2026",
    "Áreas & Sostenibilidad": "Areas2026",
    "Gastronomía": "Gastro2026",
    "Infraestructura": "Infra2026",
    "Financiero": "Financiero2026",
    "Oficina de Atención al Expositor": "Expositores2026",
    "Practicantes/Crosstraining": "Practicantes2026",
    "Talento Humano": "Talento2026",
    "Calidad": "Calidad2026",
    "Sistemas": "Sistemas2026",
    "Mercadeo y Ventas": "Ventas2026",
    "Compras": "Compras2026",
    "Gerencia de Operaciones": "Operaciones2026",
    "Gerencia General": "General2026",
    "UDEI": "Internacional2026"
  };

  const PLATFORM_URL = "https://costaricacc-horarios.web.app";
  let sentCount = 0;
  let errorCount = 0;

  // Iterar sobre los usuarios y enviar correos
  for (const user of Object.values(users)) {
    if (!user.email || !user.departamento) continue;

    const password = passwordMap[user.departamento] || "Cccr2026*";
    
    const htmlContent = `
      <p>Hola <strong>${user.nombre}</strong>,</p>
      <p>Se han generado las credenciales de acceso para la plataforma de horarios del Costa Rica Convention Center.</p>
      
      <div class="card" style="background: #f0f7f0; border-left: 4px solid #00830e; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Tus credenciales de acceso:</strong></p>
        <p style="margin: 5px 0;"><strong>Usuario:</strong> ${user.email}</p>
        <p style="margin: 5px 0;"><strong>Contraseña:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px; border: 1px solid #ddd; font-size: 1.1em;">${password}</code></p>
      </div>

      <p>Puedes ingresar a la plataforma en el siguiente enlace:</p>
      <p style="text-align: center; margin: 25px 0;">
        <a href="${PLATFORM_URL}" style="background-color: #00830e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ingresar a la Plataforma</a>
      </p>

      <div class="card" style="border-left-color: #0288d1; background: #e1f5fe;">
        <p style="margin: 0;">💡 <strong>Recomendación:</strong> Una vez que ingreses, puedes cambiar tu contraseña en el módulo de configuración para mayor seguridad.</p>
      </div>

      <p>Si tienes problemas para ingresar, por favor contacta al departamento de Sistemas.</p>
    `;

    const finalHtml = createEmailTemplate("Credenciales de Acceso", htmlContent);

    try {
      await sendEmail([user.email], "Tus credenciales de acceso - Sistema de Horarios", finalHtml);
      sentCount++;
    } catch (error) {
      console.error(`Error sending password to ${user.email}:`, error);
      errorCount++;
    }
  }

  return { success: true, sentCount, errorCount };
});
