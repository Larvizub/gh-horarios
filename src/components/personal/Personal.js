import React, { useState, useEffect } from 'react';
import { ref, get, remove } from 'firebase/database';
import { database, auth } from '../../firebase/config';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { 
  obtenerMensajeRestriccionHoras, 
  puedeModificarTipoContrato, 
  puedeAsignarRoles,
  obtenerColorRol,
  obtenerDescripcionRol,
  TIPOS_CONTRATO,
  ROLES 
} from '../../utils/contratoUtils';
import { ref as dbRef, update } from 'firebase/database';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  FormControl,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WorkIcon from '@mui/icons-material/Work';

// Estilo coherente con el resto de la app
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
  background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
  marginTop: theme.spacing(2),
  background: 'white',
  width: '100%',
  // En móvil permitir scroll horizontal, en desktop expandir
  [theme.breakpoints.down('md')]: {
    overflowX: 'auto',
  },
  [theme.breakpoints.up('md')]: {
    '& .MuiTable-root': {
      width: '100%',
      tableLayout: 'fixed', // Fuerza que las columnas usen el ancho disponible
    },
  },
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  background: 'var(--primary-color)',
  '& th': {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1rem',
    border: 0,
    // En mobile, width auto. En desktop, ancho mínimo y distribución equitativa
    [theme.breakpoints.down('md')]: {
      whiteSpace: 'nowrap',
    },
    [theme.breakpoints.up('md')]: {
      // Distribución de anchos para desktop que sume 100%
      '&:nth-of-type(1)': { width: '18%' }, // Nombre
      '&:nth-of-type(2)': { width: '18%' }, // Email
      '&:nth-of-type(3)': { width: '12%' }, // Departamento
      '&:nth-of-type(4)': { width: '12%' }, // Cargo
      '&:nth-of-type(5)': { width: '12%' }, // Tipo de Contrato
      '&:nth-of-type(6)': { width: '8%' }, // Rol
      '&:nth-of-type(7)': { width: '15%' }, // Departamentos Autorizados
      '&:nth-of-type(8)': { width: '5%' }, // Acciones
    },
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: '#f6fafd',
  },
  '&:hover': {
    backgroundColor: '#e3f2fd',
    transition: 'background 0.2s',
  },
  // Aplicar el mismo ancho que los headers para las celdas del cuerpo
  '& td': {
    [theme.breakpoints.down('md')]: {
      whiteSpace: 'nowrap',
    },
    [theme.breakpoints.up('md')]: {
      // Misma distribución que los headers
      '&:nth-of-type(1)': { width: '18%' }, // Nombre
      '&:nth-of-type(2)': { width: '18%' }, // Email
      '&:nth-of-type(3)': { width: '12%' }, // Departamento
      '&:nth-of-type(4)': { width: '12%' }, // Cargo
      '&:nth-of-type(5)': { width: '12%' }, // Tipo de Contrato
      '&:nth-of-type(6)': { width: '8%' }, // Rol
      '&:nth-of-type(7)': { width: '15%' }, // Departamentos Autorizados
      '&:nth-of-type(8)': { width: '5%' }, // Acciones
    },
  },
}));

const NameCell = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
}));

const puedeAgregarUsuarios = (usuario) => {
  return puedeAsignarRoles(usuario); // Reutilizar la lógica de roles
};

// Solo Talento Humano puede eliminar usuarios
const puedeEliminarUsuarios = (usuario) => {
  return usuario?.departamento === 'Talento Humano' ||
         usuario?.rol === ROLES.ADMINISTRADOR;
};

// Lista de departamentos disponibles para autorización
const departamentosDisponibles = [
  'Planeación de Eventos',
  'Gestión de la Protección',
  'Áreas & Sostenibilidad',
  'Gastronomía',
  'Infraestructura',
  'Financiero',
  'Talento Humano',
  'Calidad',
  'Sistemas'
];

const Personal = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [usuarios, setUsuarios] = useState([]);
  const [dialogoEliminar, setDialogoEliminar] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Estados para manejar departamentos autorizados
  const [departamentosExpandidos, setDepartamentosExpandidos] = useState({});
  const [departamentosAutorizados, setDepartamentosAutorizados] = useState([]);
  const [nuevoDepartamento, setNuevoDepartamento] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/');
          return;
        }
        const userRef = ref(database, `usuarios/${user.uid}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        const userEmail = user.email || '';
        const userDataWithEmail = { ...userData, email: userData?.email || userEmail };
        setCurrentUser(userDataWithEmail);

        if (
          userDataWithEmail.rol !== ROLES.ADMINISTRADOR &&
          userDataWithEmail.departamento !== 'Talento Humano' &&
          userDataWithEmail.email !== 'admin@costaricacc.com'
        ) {
          toast.error('No tienes permisos para acceder a esta página');
          navigate('/dashboard');
          return;
        }

        const usuariosRef = ref(database, 'usuarios');
        const usuariosSnapshot = await get(usuariosRef);
        if (usuariosSnapshot.exists()) {
          const usuariosData = usuariosSnapshot.val();
          const usuariosArray = Object.entries(usuariosData).map(([id, data]) => ({
            id,
            ...data,
            tipoContrato: data.tipoContrato || 'Operativo', // Valor por defecto para usuarios existentes
            rol: data.rol || null // Valor por defecto para roles
          }));
          setUsuarios(usuariosArray);
        } else {
          setUsuarios([]);
        }

        // Cargar departamentos autorizados para el usuario actual
        if (userDataWithEmail.departamento) {
          setDepartamentosAutorizados([userDataWithEmail.departamento]);
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        toast.error('Error al cargar usuarios: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarUsuarios();
  }, [navigate]);

  const handleEliminarClick = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setDialogoEliminar(true);
  };

  const cerrarDialogoEliminar = () => {
    setDialogoEliminar(false);
    setUsuarioSeleccionado(null);
  };

  const eliminarUsuario = async () => {
    if (!usuarioSeleccionado) return;
    try {
      await remove(ref(database, `usuarios/${usuarioSeleccionado.id}`));
      setUsuarios(usuarios.filter(u => u.id !== usuarioSeleccionado.id));
      toast.success('Usuario eliminado correctamente');
      cerrarDialogoEliminar();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.error('Error al eliminar usuario: ' + error.message);
    }
  };

  const irARegistro = () => {
    navigate('/registro');
  };

  const irAEdicion = (usuario) => {
    navigate(`/configuracion?userId=${usuario.id}`);
  };

  const handleCambiarTipoContrato = async (usuarioId, nuevoTipo) => {
    if (!puedeModificarTipoContrato(currentUser)) {
      toast.error('Solo personal de Talento Humano puede modificar el tipo de contrato');
      return;
    }

    try {
      await update(dbRef(database, `usuarios/${usuarioId}`), {
        tipoContrato: nuevoTipo
      });
      
      // Actualizar el estado local
      setUsuarios(usuarios.map(u => 
        u.id === usuarioId ? { ...u, tipoContrato: nuevoTipo } : u
      ));
      
      toast.success(`Tipo de contrato actualizado a ${nuevoTipo}`);
    } catch (error) {
      console.error('Error al actualizar tipo de contrato:', error);
      toast.error('Error al actualizar tipo de contrato: ' + error.message);
    }
  };

  const handleCambiarRol = async (usuarioId, nuevoRol) => {
    if (!puedeAsignarRoles(currentUser)) {
      toast.error('No tienes permisos para asignar roles');
      return;
    }

    try {
      const updateData = nuevoRol === 'Sin rol' ? { rol: null } : { rol: nuevoRol };
      
      await update(dbRef(database, `usuarios/${usuarioId}`), updateData);
      
      // Actualizar el estado local
      setUsuarios(usuarios.map(u => 
        u.id === usuarioId ? { ...u, rol: nuevoRol === 'Sin rol' ? null : nuevoRol } : u
      ));
      
      toast.success(`Rol actualizado ${nuevoRol === 'Sin rol' ? 'removido' : 'a ' + nuevoRol}`);
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      toast.error('Error al actualizar rol: ' + error.message);
    }
  };

  // Función para manejar cambios en departamentos autorizados
  const handleCambiarDepartamentosAutorizados = async (usuarioId, departamento, autorizado) => {
    if (!puedeAsignarRoles(currentUser)) {
      toast.error('No tienes permisos para modificar autorizaciones');
      return;
    }

    try {
      const usuario = usuarios.find(u => u.id === usuarioId);
      if (!usuario || usuario.departamento !== 'Practicantes/Crosstraining') {
        toast.error('Solo usuarios de Practicantes/Crosstraining pueden tener departamentos autorizados');
        return;
      }

      const departamentosActuales = usuario.departamentosAutorizados || [];
      let nuevosDepartamentos;

      if (autorizado) {
        // Agregar departamento si no está ya autorizado
        nuevosDepartamentos = departamentosActuales.includes(departamento) 
          ? departamentosActuales 
          : [...departamentosActuales, departamento];
      } else {
        // Remover departamento
        nuevosDepartamentos = departamentosActuales.filter(d => d !== departamento);
      }

      await update(dbRef(database, `usuarios/${usuarioId}`), {
        departamentosAutorizados: nuevosDepartamentos
      });

      // Actualizar el estado local
      setUsuarios(usuarios.map(u => 
        u.id === usuarioId ? { ...u, departamentosAutorizados: nuevosDepartamentos } : u
      ));

      toast.success(`Autorización para ${departamento} ${autorizado ? 'agregada' : 'removida'}`);
    } catch (error) {
      console.error('Error al actualizar departamentos autorizados:', error);
      toast.error('Error al actualizar autorizaciones: ' + error.message);
    }
  };

  // Función para manejar expansión de acordeones
  const handleExpandirDepartamentos = (usuarioId) => {
    setDepartamentosExpandidos(prev => ({
      ...prev,
      [usuarioId]: !prev[usuarioId]
    }));
  };

  const handleDepartamentoChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setDepartamentosAutorizados([...departamentosAutorizados, value]);
    } else {
      setDepartamentosAutorizados(departamentosAutorizados.filter(dep => dep !== value));
    }
  };

  const handleAgregarDepartamento = async () => {
    if (!nuevoDepartamento || !currentUser?.id) return;
    try {
      await update(dbRef(database, `usuarios/${currentUser.id}`), {
        departamentosAutorizados: [...departamentosAutorizados, nuevoDepartamento]
      });
      setDepartamentosAutorizados([...departamentosAutorizados, nuevoDepartamento]);
      setNuevoDepartamento('');
      toast.success('Departamento agregado correctamente');
    } catch (error) {
      console.error('Error al agregar departamento:', error);
      toast.error('Error al agregar departamento: ' + error.message);
    }
  };

  // Mostrar loading mientras se cargan los datos
  if (loading || !currentUser) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography>Cargando...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container 
      maxWidth={isMobile ? "lg" : false} 
      sx={{ 
        mt: 4, 
        mb: 4,
        // En desktop, permitir que se expanda más con máximo y padding lateral
        ...(!isMobile && {
          maxWidth: '98vw',
          px: 2
        })
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
        Gestión de Personal
      </Typography>

      <StyledPaper elevation={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
            Listado de Usuarios Registrados
          </Typography>
          {puedeAgregarUsuarios(currentUser) && (
            <Button
              variant="contained"
              color="primary"
              onClick={irARegistro}
              sx={{ borderRadius: 2, fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}
            >
              Agregar Usuario
            </Button>
          )}
        </Box>

        <StyledTableContainer>
          <Table>
            <StyledTableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Departamento</TableCell>
                <TableCell>Cargo</TableCell>
                <TableCell>Tipo de Contrato</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Departamentos Autorizados</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {usuarios.map((usuario) => (
                <StyledTableRow key={usuario.id}>
                  <TableCell>
                    <NameCell>
                      <Avatar sx={{ mr: 2, bgcolor: 'var(--secondary-color)', width: 36, height: 36, fontSize: '1rem' }}>
                        {usuario.nombre?.charAt(0)}{usuario.apellidos?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                          {usuario.nombre} {usuario.apellidos}
                        </Typography>
                        {/* Eliminado el id del usuario */}
                      </Box>
                    </NameCell>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{usuario.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={usuario.departamento}
                      color={
                        usuario.departamento === 'Talento Humano' ? 'secondary' : 
                        usuario.departamento === 'Calidad' ? 'warning' : 'default'
                      }
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{usuario.cargo}</Typography>
                  </TableCell>
                  <TableCell>
                    {puedeModificarTipoContrato(currentUser) ? (
                      <FormControl size="small" sx={{ minWidth: 120, width: '100%' }}>
                        <Select
                          value={usuario.tipoContrato || 'Operativo'}
                          onChange={(e) => handleCambiarTipoContrato(usuario.id, e.target.value)}
                          sx={{ 
                            bgcolor: 'white', 
                            '& .MuiSelect-select': { 
                              py: 0.5,
                              fontSize: '0.875rem'
                            }
                          }}
                        >
                          <MenuItem value={TIPOS_CONTRATO.OPERATIVO}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label="Operativo" 
                                color="info" 
                                size="small" 
                                sx={{ fontSize: '0.75rem' }}
                              />
                              <Typography variant="caption">(48h)</Typography>
                            </Box>
                          </MenuItem>
                          <MenuItem value={TIPOS_CONTRATO.CONFIANZA}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label="Confianza" 
                                color="success" 
                                size="small" 
                                sx={{ fontSize: '0.75rem' }}
                              />
                              <Typography variant="caption">(72h)</Typography>
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Tooltip title={obtenerMensajeRestriccionHoras(usuario.tipoContrato || 'Operativo')}>
                        <Chip
                          label={usuario.tipoContrato || 'No definido'}
                          color={
                            usuario.tipoContrato === 'Confianza' ? 'success' : 
                            usuario.tipoContrato === 'Operativo' ? 'info' : 'default'
                          }
                          size="small"
                          sx={{ fontWeight: 500, cursor: 'help' }}
                        />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    {puedeAsignarRoles(currentUser) ? (
                      <FormControl size="small" sx={{ minWidth: 120, width: '100%' }}>
                        <Select
                          value={usuario.rol || 'Sin rol'}
                          onChange={(e) => handleCambiarRol(usuario.id, e.target.value)}
                          sx={{ 
                            bgcolor: 'white', 
                            '& .MuiSelect-select': { 
                              py: 0.5,
                              fontSize: '0.875rem'
                            }
                          }}
                        >
                          <MenuItem value="Sin rol">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label="Sin rol" 
                                color="default" 
                                size="small" 
                                sx={{ fontSize: '0.75rem' }}
                              />
                            </Box>
                          </MenuItem>
                          <MenuItem value={ROLES.ADMINISTRADOR}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label="Administrador" 
                                color="error" 
                                size="small" 
                                sx={{ fontSize: '0.75rem' }}
                              />
                            </Box>
                          </MenuItem>
                          <MenuItem value={ROLES.MODIFICADOR}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label="Modificador" 
                                color="warning" 
                                size="small" 
                                sx={{ fontSize: '0.75rem' }}
                              />
                            </Box>
                          </MenuItem>
                          <MenuItem value={ROLES.VISOR}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label="Visor" 
                                color="info" 
                                size="small" 
                                sx={{ fontSize: '0.75rem' }}
                              />
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Tooltip title={obtenerDescripcionRol(usuario.rol)}>
                        <Chip
                          label={usuario.rol || 'Sin rol'}
                          color={obtenerColorRol(usuario.rol)}
                          size="small"
                          sx={{ fontWeight: 500, cursor: 'help' }}
                        />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    {usuario.departamento === 'Practicantes/Crosstraining' ? (
                      puedeAsignarRoles(currentUser) ? (
                        <Box>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<WorkIcon />}
                            onClick={() => handleExpandirDepartamentos(usuario.id)}
                            sx={{ mb: 1, fontSize: '0.75rem' }}
                          >
                            Autorizar Departamentos
                          </Button>
                          {departamentosExpandidos[usuario.id] && (
                            <Box sx={{ mt: 1, maxWidth: 200 }}>
                              <FormGroup>
                                {departamentosDisponibles.map(departamento => (
                                  <FormControlLabel
                                    key={departamento}
                                    control={
                                      <Checkbox
                                        checked={usuario.departamentosAutorizados?.includes(departamento) || false}
                                        onChange={(e) => handleCambiarDepartamentosAutorizados(
                                          usuario.id, 
                                          departamento, 
                                          e.target.checked
                                        )}
                                        size="small"
                                      />
                                    }
                                    label={
                                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                        {departamento}
                                      </Typography>
                                    }
                                    sx={{ margin: 0, height: 28 }}
                                  />
                                ))}
                              </FormGroup>
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Box>
                          {usuario.departamentosAutorizados?.length > 0 ? (
                            usuario.departamentosAutorizados.map(dep => (
                              <Chip
                                key={dep}
                                label={dep}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                              />
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Sin autorizaciones
                            </Typography>
                          )}
                        </Box>
                      )
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Solo para Practicantes
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar Usuario">
                      <IconButton onClick={() => irAEdicion(usuario)} color="primary" size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {puedeEliminarUsuarios(currentUser) && (
                      <Tooltip title="Eliminar Usuario">
                        <IconButton onClick={() => handleEliminarClick(usuario)} color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </StyledTableContainer>

        {/* Sección para gestionar departamentos autorizados (solo visible para Talento Humano) */}
        {currentUser?.rol === ROLES.ADMINISTRADOR && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mb: 2 }}>
              Gestión de Departamentos Autorizados
            </Typography>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Departamentos Autorizados</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  {departamentosDisponibles.map((dep) => (
                    <FormControlLabel
                      key={dep}
                      control={
                        <Checkbox 
                          checked={departamentosAutorizados.includes(dep)} 
                          onChange={handleDepartamentoChange}
                          value={dep}
                          color="primary"
                        />
                      }
                      label={dep}
                    />
                  ))}
                </FormGroup>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 120, flexGrow: 1, mr: 1 }}>
                    <Select
                      value={nuevoDepartamento}
                      onChange={(e) => setNuevoDepartamento(e.target.value)}
                      displayEmpty
                      sx={{ 
                        bgcolor: 'white', 
                        '& .MuiSelect-select': { 
                          py: 0.5,
                          fontSize: '0.875rem'
                        }
                      }}
                    >
                      <MenuItem value="">
                        <em>Agregar nuevo departamento</em>
                      </MenuItem>
                      {departamentosDisponibles.map((dep) => (
                        <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAgregarDepartamento}
                    disabled={!nuevoDepartamento}
                    sx={{ borderRadius: 2, fontWeight: 'bold' }}
                  >
                    Agregar
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </StyledPaper>

      <Dialog
        open={dialogoEliminar}
        onClose={cerrarDialogoEliminar}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ color: 'var(--error-color)' }}>
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Estás seguro de que deseas eliminar al usuario {usuarioSeleccionado?.nombre} {usuarioSeleccionado?.apellidos}?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogoEliminar} color="primary">
            Cancelar
          </Button>
          <Button onClick={eliminarUsuario} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Personal;