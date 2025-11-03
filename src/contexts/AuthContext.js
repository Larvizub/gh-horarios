import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, database } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';

const AuthContext = createContext();

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