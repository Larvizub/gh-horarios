import { useState, useEffect } from 'react';
import { database } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { toast } from 'react-toastify';
import { departamentos } from '../utils/horariosConstants';

/**
 * Hook para cargar usuarios y gestionar departamento seleccionado y usuario actual.
 * Optimizado para cargar solo los usuarios del departamento seleccionado.
 */
export function useUsuariosYHorarios() {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState('');
  const [userData, setUserData] = useState(null);
  const { currentUser: authUser, loading: authLoading } = useAuth();

  // Cargar datos del usuario logueado para permisos y depto inicial
  useEffect(() => {
    async function cargarMiPerfil() {
      if (authLoading || !authUser) return;
      try {
        const snapshot = await get(ref(database, `usuarios/${authUser.uid}`));
        if (snapshot.exists()) {
          const myData = { id: authUser.uid, ...snapshot.val() };
          setUserData(myData);
          setDepartamentoSeleccionado(myData.departamento || (departamentos.length > 0 ? departamentos[0] : ''));
        } else if (departamentos.length > 0) {
          setDepartamentoSeleccionado(departamentos[0]);
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
      }
    }
    cargarMiPerfil();
  }, [authUser, authLoading]);

  // Cargar usuarios del departamento seleccionado únicamente
  useEffect(() => {
    async function cargarUsuariosDepto() {
      if (!departamentoSeleccionado) return;
      
      try {
        setLoading(true);
        // Usamos una consulta filtrada por departamento para no cargar todos los usuarios
        const usuariosRef = ref(database, 'usuarios');
        const deptoQuery = query(usuariosRef, orderByChild('departamento'), equalTo(departamentoSeleccionado));
        
        const snapshot = await get(deptoQuery);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const array = Object.entries(data).map(([id, userData]) => ({
            id,
            ...userData,
            tipoContrato: userData.tipoContrato || 'Operativo'
          }));
          setUsuarios(array);
        } else {
          setUsuarios([]);
        }
      } catch (error) {
        console.error('Error al cargar usuarios por departamento:', error);
        toast.error('Error al cargar la lista de personal del departamento');
      } finally {
        setLoading(false);
      }
    }

    cargarUsuariosDepto();
  }, [departamentoSeleccionado]);

  return {
    loading,
    usuarios,
    departamentoSeleccionado,
    setDepartamentoSeleccionado,
    currentUser: authUser,
    userData // Exportamos userData para evitar que Horarios.js tenga que buscarlo en la lista de usuarios
  };
}
