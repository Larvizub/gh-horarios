/**
 * Utilidades para manejo de tipos de contrato, roles y restricciones de horas
 */

// Tipos de contrato disponibles
export const TIPOS_CONTRATO = {
  OPERATIVO: 'Operativo',
  CONFIANZA: 'Confianza'
};

// Roles disponibles en el sistema
export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  MODIFICADOR: 'Modificador', 
  VISOR: 'Visor'
};

// Horas máximas permitidas por tipo de contrato
export const HORAS_MAXIMAS_POR_TIPO = {
  [TIPOS_CONTRATO.OPERATIVO]: 48,
  [TIPOS_CONTRATO.CONFIANZA]: 72
};

/**
 * Obtiene las horas máximas permitidas para un tipo de contrato
 * @param {string} tipoContrato - El tipo de contrato del usuario
 * @returns {number} Las horas máximas permitidas
 */
export const obtenerHorasMaximas = (tipoContrato) => {
  return HORAS_MAXIMAS_POR_TIPO[tipoContrato] || HORAS_MAXIMAS_POR_TIPO[TIPOS_CONTRATO.OPERATIVO];
};

/**
 * Valida si las horas trabajadas exceden el límite para el tipo de contrato
 * @param {number} horasTrabajadas - Las horas trabajadas en la semana
 * @param {string} tipoContrato - El tipo de contrato del usuario
 * @returns {boolean} true si excede el límite, false en caso contrario
 */
export const excedeHorasMaximas = (horasTrabajadas, tipoContrato) => {
  const horasMaximas = obtenerHorasMaximas(tipoContrato);
  return horasTrabajadas > horasMaximas;
};

/**
 * Obtiene un mensaje descriptivo sobre las restricciones de horas
 * @param {string} tipoContrato - El tipo de contrato del usuario
 * @returns {string} Mensaje descriptivo de las restricciones
 */
export const obtenerMensajeRestriccionHoras = (tipoContrato) => {
  const horasMaximas = obtenerHorasMaximas(tipoContrato);
  return `Los empleados de tipo ${tipoContrato} tienen un límite de ${horasMaximas} horas semanales.`;
};

/**
 * Verifica si un usuario puede modificar tipos de contrato
 * @param {Object} usuario - El objeto usuario con sus datos
 * @returns {boolean} true si puede modificar tipos de contrato
 */
export const puedeModificarTipoContrato = (usuario) => {
  return usuario?.departamento === 'Talento Humano';
};

/**
 * Verifica si un usuario puede asignar roles
 * @param {Object} usuario - El objeto usuario con sus datos
 * @returns {boolean} true si puede asignar roles
 */
export const puedeAsignarRoles = (usuario) => {
  return usuario?.rol === ROLES.ADMINISTRADOR || 
         usuario?.departamento === 'Talento Humano' ||
         usuario?.email === 'admin@costaricacc.com';
};

/**
 * Verifica si un usuario puede modificar horarios
 * @param {Object} usuario - El objeto usuario con sus datos
 * @param {Object} objetivoUsuario - El usuario objetivo a modificar (opcional)
 * @returns {boolean} true si puede modificar horarios
 */
export const puedeModificarHorarios = (usuario, objetivoUsuario = null) => {
  // Administradores pueden modificar todo
  if (usuario?.rol === ROLES.ADMINISTRADOR) {
    return true;
  }
  
  // Modificadores pueden modificar horarios de su departamento
  if (usuario?.rol === ROLES.MODIFICADOR) {
    if (!objetivoUsuario) return true; // Permiso general para el departamento
    return usuario?.departamento === objetivoUsuario?.departamento;
  }
  
  // Visores no pueden modificar nada
  if (usuario?.rol === ROLES.VISOR) {
    return false;
  }
  
  // Usuarios sin rol específico mantienen la lógica anterior
  return usuario?.departamento === 'Talento Humano' || 
         usuario?.email === 'admin@costaricacc.com';
};

/**
 * Verifica si un usuario puede ver horarios
 * @param {Object} usuario - El objeto usuario con sus datos
 * @param {Object} objetivoUsuario - El usuario objetivo a ver (opcional)
 * @returns {boolean} true si puede ver horarios
 */
export const puedeVerHorarios = (usuario, objetivoUsuario = null) => {
  // Administradores pueden ver todo
  if (usuario?.rol === ROLES.ADMINISTRADOR) {
    return true;
  }
  
  // Modificadores y Visores pueden ver horarios de su departamento
  if (usuario?.rol === ROLES.MODIFICADOR || usuario?.rol === ROLES.VISOR) {
    if (!objetivoUsuario) return true; // Permiso general para el departamento
    return usuario?.departamento === objetivoUsuario?.departamento;
  }
  
  // Usuarios sin rol específico mantienen la lógica anterior
  return usuario?.departamento === 'Talento Humano' || 
         usuario?.email === 'admin@costaricacc.com';
};

/**
 * Verifica si un usuario puede acceder al módulo de personal
 * @param {Object} usuario - El objeto usuario con sus datos
 * @returns {boolean} true si puede acceder al módulo de personal
 */
export const puedeAccederPersonal = (usuario) => {
  return usuario?.rol === ROLES.ADMINISTRADOR ||
         usuario?.departamento === 'Talento Humano' ||
         usuario?.email === 'admin@costaricacc.com';
};

/**
 * Obtiene el color del chip según el rol
 * @param {string} rol - El rol del usuario
 * @returns {string} El color del chip para Material-UI
 */
export const obtenerColorRol = (rol) => {
  switch (rol) {
    case ROLES.ADMINISTRADOR:
      return 'error'; // Rojo para administrador
    case ROLES.MODIFICADOR:
      return 'warning'; // Naranja para modificador
    case ROLES.VISOR:
      return 'info'; // Azul para visor
    default:
      return 'default'; // Gris por defecto
  }
};

/**
 * Obtiene una descripción del rol
 * @param {string} rol - El rol del usuario
 * @returns {string} Descripción del rol
 */
export const obtenerDescripcionRol = (rol) => {
  switch (rol) {
    case ROLES.ADMINISTRADOR:
      return 'Puede realizar todos los cambios en la plataforma';
    case ROLES.MODIFICADOR:
      return 'Puede modificar horarios de su departamento';
    case ROLES.VISOR:
      return 'Solo puede ver horarios, sin modificaciones';
    default:
      return 'Sin rol específico asignado';
  }
};
