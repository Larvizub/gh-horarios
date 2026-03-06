// Colores y etiquetas de roles
export const obtenerColorRol = (rol) => {
  switch (rol) {
    case 'Administrador':
      return 'error';
    case 'Modificador':
      return 'warning';
    case 'Visualizador':
      return 'success';
    default:
      return 'default';
  }
};

export const obtenerEtiquetaRol = (rol) => {
  switch (rol) {
    case 'Administrador':
      return 'Admin';
    case 'Modificador':
      return 'Mod';
    case 'Visualizador':
      return 'Ver';
    default:
      return 'Ver';
  }
};

// Permisos
export const puedeEditarHorarios = (usuario) => {
  if (!usuario) return false;
  return ['Administrador', 'Modificador'].includes(usuario.rol);
};

export const puedeEliminarHorarios = (usuario) => {
  if (!usuario) return false;
  return ['Administrador', 'Modificador'].includes(usuario.rol);
};

// Conversión de hora
export const convertirA24h = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return { hora: h, minutos: m };
};

const calcularHorasRango = (inicio, fin) => {
  if (!inicio || !fin) return 0;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  if ([h1, m1, h2, m2].some((v) => Number.isNaN(v))) return 0;

  // Si son iguales, no hay horas laboradas.
  if (h1 === h2 && m1 === m2) return 0;

  if (h2 > h1 || (h2 === h1 && m2 > m1)) {
    return (h2 - h1) + (m2 - m1) / 60;
  }

  return (24 - h1 + h2) + (m2 - m1) / 60;
};

const calcularHorasTurno = (turno) => {
  if (!turno) return 0;

  if (typeof turno.horas === 'number' && Number.isFinite(turno.horas) && turno.horas > 0) {
    return turno.horas;
  }

  if (turno.tipo === 'tele-presencial') {
    return calcularHorasRango(turno.horaInicioTele, turno.horaFinTele) +
      calcularHorasRango(turno.horaInicioPres, turno.horaFinPres);
  }

  if (turno.tipo === 'horario-dividido') {
    return calcularHorasRango(turno.horaInicioBloque1, turno.horaFinBloque1) +
      calcularHorasRango(turno.horaInicioBloque2, turno.horaFinBloque2);
  }

  return calcularHorasRango(turno.horaInicio, turno.horaFin);
};

// Cálculo de horas totales
export const calcularHorasTotales = (
  usuarioId,
  editando,
  horariosEditados = {},
  horarios = {},
  semanaSeleccionada,
  semanaActual,
  horasExtras,
  obtenerUsuario,
  obtenerHorasMaximas,
  mostrarReal = false
) => {
  // Asegura que los objetos existen
  const horariosEditadosSafe = horariosEditados || {};
  const horariosSafe = horarios || {};

  const horariosUsuario = editando
    ? (horariosEditadosSafe[usuarioId] || {})
    : (horariosSafe[usuarioId] || {});

  // Si no hay horarios para el usuario, retorna 0
  if (!horariosUsuario || typeof horariosUsuario !== 'object') return 0;

  const NO_SUMAN_HORAS = ['descanso', 'vacaciones', 'feriado', 'permiso', 'dia-brigada', 'media-cumple'];
  const total = Object.values(horariosUsuario).reduce((total, turno) => {
    if (!turno || NO_SUMAN_HORAS.includes(turno.tipo)) return total;
    return total + calcularHorasTurno(turno);
  }, 0);

  // Si estamos en la pestaña de la semana actual, las horas totales son las horas trabajadas
  if (
    semanaSeleccionada && semanaActual &&
    semanaSeleccionada.getTime && semanaActual.getTime &&
    (semanaSeleccionada.getTime() === semanaActual.getTime() || mostrarReal)
  ) {
    return total;
  }
  
  // Para la próxima semana, restamos las horas extras de la semana actual (si existen)
  const horasExtrasPrevias = horasExtras[usuarioId] || 0;
  const usuario = obtenerUsuario(usuarioId);
  const horasMaximas = obtenerHorasMaximas(usuario?.tipoContrato || 'Operativo');
  const horasMinimas = Math.min(horasMaximas - 8, 40); // Mínimo 40 horas o 8 menos que las máximas
  const horasDisponibles = Math.max(horasMaximas - horasExtrasPrevias, horasMinimas);

  return mostrarReal ? total : Math.min(total, horasDisponibles);
};

// Cálculo de horas excedentes
export const calcularHorasExcedentes = (
  usuarioId,
  editando,
  horariosEditados,
  horarios,
  obtenerUsuario,
  obtenerHorasMaximas
) => {
  // Llama directamente a calcularHorasTotales con los argumentos necesarios
  const horasTotales = calcularHorasTotales(usuarioId, editando, horariosEditados, horarios, null, null, {}, obtenerUsuario, obtenerHorasMaximas, true);
  const usuario = obtenerUsuario(usuarioId);
  const horasMaximas = obtenerHorasMaximas(usuario?.tipoContrato || 'Operativo');
  return Math.max(horasTotales - horasMaximas, 0);
};

// Buscar practicantes disponibles
export const encontrarPracticantesDisponibles = (
  horasNecesarias,
  usuarios,
  calcularHorasTotalesFn,
  obtenerHorasMaximas,
  departamentoDestino = null,
  usuarioExcedidoId = null
) => {
  // Validaciones básicas para evitar excepciones
  const safeUsuarios = Array.isArray(usuarios) ? usuarios : [];
  const safeHorasNecesarias = Number(horasNecesarias) || 0;

  // Sugerir primero compañeros del mismo departamento (excepto el usuario excedido)
  const compañeros = safeUsuarios.filter(usuario =>
    usuario && usuario.departamento === departamentoDestino &&
    usuario.id !== usuarioExcedidoId
  );

  const compañerosDisponibles = compañeros.map(compañero => {
    const horasTotales = calcularHorasTotalesFn(compañero.id, true) || 0;
    const horasMaximas = obtenerHorasMaximas(compañero.tipoContrato || 'Operativo') || 0;
    const horasDisponibles = horasMaximas - horasTotales;
    return {
      usuario: compañero,
      horasDisponibles: Number(horasDisponibles.toFixed(1)),
      horasTotales: Number(horasTotales.toFixed(1)),
      horasMaximas
    };
  }).filter(c => c.horasDisponibles >= safeHorasNecesarias);

  // Luego practicantes autorizados para el departamento
  const practicantes = safeUsuarios.filter(usuario =>
    usuario && usuario.departamento === 'Practicantes/Crosstraining' &&
    (!departamentoDestino || (usuario.departamentosAutorizados && Array.isArray(usuario.departamentosAutorizados) && usuario.departamentosAutorizados.includes(departamentoDestino)))
  );

  const practicantesDisponibles = practicantes.map(practicante => {
    const horasTotales = calcularHorasTotalesFn(practicante.id, true) || 0;
    const horasMaximas = obtenerHorasMaximas(practicante.tipoContrato || 'Operativo') || 0;
    const horasDisponibles = horasMaximas - horasTotales;
    return {
      usuario: practicante,
      horasDisponibles: Number(horasDisponibles.toFixed(1)),
      horasTotales: Number(horasTotales.toFixed(1)),
      horasMaximas
    };
  }).filter(p => p.horasDisponibles >= safeHorasNecesarias);

  // Junta ambos grupos, primero compañeros, luego practicantes
  return [
    ...compañerosDisponibles.sort((a, b) => b.horasDisponibles - a.horasDisponibles),
    ...practicantesDisponibles.sort((a, b) => b.horasDisponibles - a.horasDisponibles)
  ];
};

// Generar mensaje de recomendación de practicantes
export const generarRecomendacionPracticantes = (usuarioExcedido, horasExceso, encontrarPracticantesDisponiblesFn) => {
  // Pasa el departamento destino y el usuario excedido
  const disponibles = encontrarPracticantesDisponiblesFn(horasExceso, usuarioExcedido.departamento, usuarioExcedido.id);

  if (disponibles.length === 0) {
    return `⚠️ ${usuarioExcedido.nombre} ${usuarioExcedido.apellidos} excede ${horasExceso.toFixed(1)}h. No hay compañeros ni practicantes disponibles con suficientes horas.`;
  }

  const recomendaciones = disponibles.slice(0, 3).map(p =>
    `• ${p.usuario.nombre} ${p.usuario.apellidos} (${p.horasDisponibles}h disponibles de ${p.horasMaximas}h)`
  ).join('\n');

  return `⚠️ ${usuarioExcedido.nombre} ${usuarioExcedido.apellidos} excede ${horasExceso.toFixed(1)}h\n\n🔄 Compañeros/practicantes disponibles para redistribuir:\n${recomendaciones}`;
};
