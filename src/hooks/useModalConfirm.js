import { useState, useCallback } from 'react';

/**
 * Hook para gestionar un modal de confirmación genérico.
 */
export function useModalConfirm() {
  const [modalConfirmacion, setModalConfirmacion] = useState({
    abierto: false,
    tipo: 'info',
    titulo: '',
    mensaje: '',
    textoConfirmar: 'Confirmar',
    textoCancelar: 'Cancelar',
    onConfirmar: null,
    onCancelar: null,
    soloInfo: false,
  });

  const mostrarModal = useCallback((options) => {
    setModalConfirmacion({ abierto: true, ...options });
  }, []);

  const cerrarModal = useCallback(() => {
    setModalConfirmacion((prev) => ({ ...prev, abierto: false }));
  }, []);

  return { modalConfirmacion, mostrarModal, cerrarModal };
}
