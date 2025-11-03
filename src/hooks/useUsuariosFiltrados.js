import { useMemo } from 'react';

export function useUsuariosFiltrados(usuarios, departamentoSeleccionado) {
  return useMemo(() => {
    if (!usuarios) return [];
    if (!departamentoSeleccionado) return usuarios;
    return usuarios.filter(u => u.departamento === departamentoSeleccionado);
  }, [usuarios, departamentoSeleccionado]);
}
