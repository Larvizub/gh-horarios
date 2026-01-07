import { useState, useEffect } from 'react';
import { database } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { ref, get } from 'firebase/database';
import { toast } from 'react-toastify';
import { departamentos } from '../utils/horariosConstants';

/**
 * Hook para cargar usuarios y gestionar departamento seleccionado y usuario actual.
 */
export function useUsuariosYHorarios() {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const { currentUser: authUser, loading: authLoading } = useAuth();

  useEffect(() => {
    async function cargarUsuarios() {
      try {
        setLoading(true);
        if (authLoading) return;
        const user = authUser;
        if (!user) return;
        setCurrentUser(user);

        const usuariosRef = ref(database, 'usuarios');
        const snapshot = await get(usuariosRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const array = Object.entries(data).map(([id, userData]) => ({
            id,
            ...userData,
            tipoContrato: userData.tipoContrato || 'Operativo'
          }));
          setUsuarios(array);

          const usuarioActual = array.find(u => u.id === user.uid);
          if (usuarioActual) {
            setDepartamentoSeleccionado(usuarioActual.departamento);
          } else if (departamentos.length > 0) {
            setDepartamentoSeleccionado(departamentos[0]);
          }
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        toast.error('Error al cargar usuarios: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
    cargarUsuarios();
  }, [authLoading, authUser]);

  return {
    loading,
    usuarios,
    departamentoSeleccionado,
    setDepartamentoSeleccionado,
    currentUser
  };
}
