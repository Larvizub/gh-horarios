import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, database } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { toast } from 'react-toastify';

const AuthContext = createContext();

const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 horas en milisegundos

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener datos del usuario
  const fetchUserData = useCallback(async (uid) => {
    try {
      const userRef = ref(database, `usuarios/${uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      setError('Error al cargar datos del usuario');
      return null;
    }
  }, []);

  // Función para cerrar sesión por inactividad
  const checkInactivity = useCallback(async () => {
    if (!auth.currentUser) return;
    
    const lastActivity = localStorage.getItem('lastActivity');
    const now = Date.now();

    if (lastActivity && (now - parseInt(lastActivity)) > INACTIVITY_TIMEOUT) {
      try {
        await signOut(auth);
        toast.info('Tu sesión ha expirado por inactividad');
        console.log('Sesión cerrada por 2 horas de inactividad');
      } catch (error) {
        console.error('Error al cerrar sesión por inactividad:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      localStorage.removeItem('lastActivity');
      return;
    }

    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    // Verificar inmediatamente al cargar/autenticar
    checkInactivity();
    updateActivity();

    // Eventos para rastrear actividad
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    
    // Limitar actualizaciones por mousemove para evitar exceso de escritura
    let lastThrottleUpdate = Date.now();
    const handleActivity = (e) => {
      if (e.type === 'mousemove') {
        const now = Date.now();
        if (now - lastThrottleUpdate < 60000) return; // Solo una vez por minuto para mousemove
        lastThrottleUpdate = now;
      }
      updateActivity();
    };

    events.forEach(event => window.addEventListener(event, handleActivity));

    // Verificar cada minuto si ha pasado el tiempo de inactividad
    const interval = setInterval(checkInactivity, 60000);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearInterval(interval);
    };
  }, [currentUser, checkInactivity]);

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user && isMounted) {
          setCurrentUser(user);
          const userData = await fetchUserData(user.uid);
          if (isMounted) {
            setUserData(userData);
          }
        } else if (isMounted) {
          setCurrentUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error('Error en onAuthStateChanged:', error);
        if (isMounted) {
          setError('Error de autenticación');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [fetchUserData]);

  const value = {
    currentUser,
    userData,
    loading,
    error,
    fetchUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};