export function obtenerUsuario(usuarios, usuarioId) {
  if (!usuarios || !usuarioId) return null;
  return usuarios.find(u => u.id === usuarioId);
}

export function mostrarModalConfirmacion(setModalConfirmacion, configuracion) {
  // Evita error si configuracion es undefined o null
  const conf = configuracion && typeof configuracion === 'object' ? configuracion : {};
  setModalConfirmacion({
    abierto: true,
    tipo: conf.tipo || 'info',
    titulo: conf.titulo || '',
    mensaje: conf.mensaje || '',
    textoConfirmar: conf.textoConfirmar || 'Confirmar',
    textoCancelar: conf.textoCancelar || 'Cancelar',
    onConfirmar: conf.onConfirmar || null,
    onCancelar: conf.onCancelar || null,
    soloInfo: conf.soloInfo || false
  });
}

export function crearHorarioPorTipo(tipo) {
  if (tipo === 'viaje-trabajo') {
    return {
      tipo: 'viaje-trabajo',
      horaInicio: '08:00',
      horaFin: '18:00',
      horas: 10
    };
  }
}

