import { useState, useCallback } from 'react';
import { notify } from '../services/notify';

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
    if (options?.soloInfo) {
      const toastPayload = {
        title: options.titulo || 'Información',
        description: options.mensaje || '',
      };

      if (options.tipo === 'success') {
        notify.success(toastPayload);
        return;
      }

      if (options.tipo === 'error') {
        notify.error(toastPayload);
        return;
      }

      if (options.tipo === 'warning') {
        notify.warning(toastPayload);
        return;
      }

      notify.info(toastPayload);
      return;
    }

    setModalConfirmacion({ abierto: true, ...options });
  }, []);

  const cerrarModal = useCallback(() => {
    setModalConfirmacion((prev) => ({ ...prev, abierto: false }));
  }, []);

  return { modalConfirmacion, mostrarModal, cerrarModal };
}
