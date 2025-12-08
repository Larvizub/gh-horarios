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

const baseStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; }
  .header { background-color: #00830e; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
  .content { padding: 20px; }
  .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
  .card { background: #f9f9f9; padding: 10px; margin-bottom: 10px; border-left: 4px solid #00830e; border-radius: 4px; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; color: white; }
  .tag-teletrabajo { background-color: #2e7d32; }
  .tag-fuera { background-color: #757575; }
  .tag-vacaciones { background-color: #0288d1; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
  th { background-color: #f2f2f2; }
`;

function createEmailTemplate(title, content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${title}</h2>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>Este es un mensaje automático del Sistema de Horarios.</p>
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
      const scheduleType = userSchedule[dayKey];
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
      const scheduleType = userSchedule[dayKey];
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

      htmlContent += `<h3>${dept}</h3>`;
      htmlContent += `<table>
        <thead>
          <tr>
            <th>Colaborador</th>
            <th>Lun</th>
            <th>Mar</th>
            <th>Mié</th>
            <th>Jue</th>
            <th>Vie</th>
          </tr>
        </thead>
        <tbody>`;

      deptSchedules.forEach(({ user, schedule }) => {
        htmlContent += `<tr>
          <td><strong>${user.nombre} ${user.apellidos.split(" ")[0]}</strong></td>
          <td>${formatSchedule(schedule.dia1)}</td>
          <td>${formatSchedule(schedule.dia2)}</td>
          <td>${formatSchedule(schedule.dia3)}</td>
          <td>${formatSchedule(schedule.dia4)}</td>
          <td>${formatSchedule(schedule.dia5)}</td>
        </tr>`;
      });

      htmlContent += `</tbody></table>`;
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
  // Mapear códigos a etiquetas cortas
  const map = {
    "teletrabajo": "🏠 TT",
    "tele-presencial": "🏢/🏠 TP",
    "vacaciones": "🏖️ VAC",
    "descanso": "💤 DES",
    "feriado": "📅 FER",
    "permiso": "✋ PER",
    "incapacidad-enfermedad": "🏥 INC",
    "fuera-oficina": "🚫 OFF",
    "dia-brigada": "⛑️ BRI"
  };
  // Si es un rango de tiempo (ej. "08:00-17:00"), mantenerlo, de lo contrario mapearlo
  return map[val] || val;
}
