import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import useTiposHorario from '../../hooks/useTiposHorario';
import useTiposContrato from '../../hooks/useTiposContrato';
import useJornadasTrabajo from '../../hooks/useJornadasTrabajo';
import useJornadasOrdinarias from '../../hooks/useJornadasOrdinarias';
import { notify as toast } from '../../services/notify';
import { saveJornadasTrabajo } from '../../services/jornadasTrabajoService';
import { saveJornadasOrdinarias } from '../../services/jornadasOrdinariasService';
import {
  JORNADAS_DIAS,
  JORNADAS_DIAS_LABELS,
  calcularHorasJornadaTrabajo,
  cloneJornadaPattern,
  createEmptyJornadaPattern,
  formatJornadaTrabajoResumen,
  sanitizeJornadaTrabajoKey,
} from '../../utils/jornadasTrabajo';
import { formatTipoContratoHoras, sanitizeTipoContratoKey } from '../../utils/tiposContrato';
import { DEFAULT_JORNADAS_ORDINARIAS, formatCoberturaJornadaOrdinaria } from '../../utils/jornadasOrdinarias';

const HIGHLIGHT_BLUE = '#dbeafe';

const createEmptyForm = () => ({
  label: '',
  descripcion: '',
  horasMinimasSemanales: '',
  horasMaximasSemanales: '',
  aplicaAContratos: [],
  patternSemanal: createEmptyJornadaPattern(),
});

const JOURNEY_TYPES = ['personalizado', 'teletrabajo', 'tarde-libre', 'descanso', 'vacaciones', 'feriado', 'permiso', 'dia-brigada', 'beneficio-operaciones', 'media-cumple', 'fuera-oficina', 'viaje-trabajo', 'incapacidad-enfermedad', 'incapacidad-accidente'];

const isNoHoursType = (tipo) => ['descanso', 'vacaciones', 'feriado', 'permiso', 'dia-brigada', 'media-cumple', 'fuera-oficina', 'incapacidad-enfermedad', 'incapacidad-accidente'].includes(tipo);

const calculateHourRange = (start, end) => {
  if (!start || !end) return 0;
  const [h1, m1] = String(start).split(':').map(Number);
  const [h2, m2] = String(end).split(':').map(Number);
  if ([h1, m1, h2, m2].some((value) => Number.isNaN(value))) return 0;
  if (h1 === h2 && m1 === m2) return 0;
  if (h2 > h1 || (h2 === h1 && m2 > m1)) {
    return Number(((h2 - h1) + ((m2 - m1) / 60)).toFixed(2));
  }
  return Number(((24 - h1 + h2) + ((m2 - m1) / 60)).toFixed(2));
};

const JornadasManager = () => {
  const { tipos: tiposHorario } = useTiposHorario();
  const { tipos: tiposContrato, tiposMap: tiposContratoMap } = useTiposContrato();
  const { jornadas, loadingJornadas } = useJornadasTrabajo();
  const { jornadas: jornadasOrdinarias, loadingJornadasOrdinarias } = useJornadasOrdinarias();
  const [saving, setSaving] = useState(false);
  const [savingOrdinarias, setSavingOrdinarias] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [form, setForm] = useState(createEmptyForm());
  const [jornadasOrdinariasDraft, setJornadasOrdinariasDraft] = useState(DEFAULT_JORNADAS_ORDINARIAS);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (Array.isArray(jornadasOrdinarias) && jornadasOrdinarias.length > 0) {
      setJornadasOrdinariasDraft(jornadasOrdinarias.map((jornada) => ({ ...jornada })));
    }
  }, [jornadasOrdinarias]);

  const sortedJornadas = useMemo(() => {
    return [...jornadas].sort((a, b) => a.orden - b.orden);
  }, [jornadas]);

  const sanitizedContractOptions = useMemo(() => {
    return tiposContrato.map((tipo) => ({
      key: sanitizeTipoContratoKey(tipo.key || tipo.label),
      label: tipo.label,
      hours: formatTipoContratoHoras(tipo.key, tiposContratoMap),
    }));
  }, [tiposContrato, tiposContratoMap]);

  const formatAppliedContracts = (keys = []) => {
    if (!Array.isArray(keys) || keys.length === 0) {
      return 'Todos';
    }

    return keys
      .map((key) => {
        const option = sanitizedContractOptions.find((candidate) => candidate.key === sanitizeTipoContratoKey(key));

        if (!option) {
          return key;
        }

        return `${option.label} (${option.hours})`;
      })
      .join(', ');
  };

  const updateJornadaOrdinariaDraft = (key, field, value) => {
    setJornadasOrdinariasDraft((current) => current.map((jornada) => {
      if (jornada.key !== key) {
        return jornada;
      }

      return {
        ...jornada,
        [field]: value,
      };
    }));
  };

  const handleSaveJornadasOrdinarias = async () => {
    try {
      setSavingOrdinarias(true);
      await saveJornadasOrdinarias(jornadasOrdinariasDraft.map((jornada) => ({
        ...jornada,
        limiteDiario: Number(jornada.limiteDiario) || 0,
        limiteSemanal: Number(jornada.limiteSemanal) || 0,
      })));
      toast.success('Se guardaron las jornadas ordinarias.');
    } catch (error) {
      toast.error(`No se pudieron guardar las jornadas ordinarias: ${error.message}`);
    } finally {
      setSavingOrdinarias(false);
    }
  };

  const resetForm = (basePattern = createEmptyJornadaPattern()) => {
    setForm({
      ...createEmptyForm(),
      patternSemanal: cloneJornadaPattern(basePattern),
    });
    setEditingKey(null);
  };

  const openCreateModal = () => {
    resetForm(sortedJornadas[0]?.patternSemanal || createEmptyJornadaPattern());
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    resetForm();
  };

  const handleEdit = (jornada) => {
    setEditingKey(jornada.key);
    setForm({
      label: jornada.label || '',
      descripcion: jornada.descripcion || '',
      horasMinimasSemanales: String(jornada.horasMinimasSemanales ?? ''),
      horasMaximasSemanales: String(jornada.horasMaximasSemanales ?? ''),
      aplicaAContratos: Array.isArray(jornada.aplicaAContratos) ? jornada.aplicaAContratos : [],
      patternSemanal: cloneJornadaPattern(jornada.patternSemanal || createEmptyJornadaPattern()),
    });
    setEditModalOpen(true);
  };

  const handleDayChange = (dia, field, value) => {
    setForm((current) => ({
      ...current,
      patternSemanal: {
        ...current.patternSemanal,
        [dia]: {
          ...current.patternSemanal[dia],
          [field]: value,
          ...(field === 'tipo' && isNoHoursType(value)
            ? { horaInicio: '', horaFin: '', horas: 0 }
            : {}),
        },
      },
    }));
  };

  const handleSave = async () => {
    const label = form.label.trim();
    const descripcion = form.descripcion.trim();
    const totalHoras = calcularHorasJornadaTrabajo(form.patternSemanal);
    const horasMinimasSemanales = Number(form.horasMinimasSemanales);
    const horasMaximasSemanales = Number(form.horasMaximasSemanales);

    if (!label) {
      toast.error('El nombre de la jornada es obligatorio.');
      return;
    }

    if (totalHoras <= 0) {
      toast.error('La jornada debe tener al menos un día con horas asignadas.');
      return;
    }

    if (!Number.isFinite(horasMinimasSemanales) || horasMinimasSemanales <= 0) {
      toast.error('Las horas mínimas semanales deben ser mayores que cero.');
      return;
    }

    if (!Number.isFinite(horasMaximasSemanales) || horasMaximasSemanales <= 0) {
      toast.error('Las horas máximas semanales deben ser mayores que cero.');
      return;
    }

    if (horasMinimasSemanales > horasMaximasSemanales) {
      toast.error('Las horas mínimas semanales no pueden ser mayores que las máximas.');
      return;
    }

    const key = sanitizeJornadaTrabajoKey(label);
    if (!key) {
      toast.error('El nombre de la jornada no genera una clave válida.');
      return;
    }

    const duplicate = sortedJornadas.some((jornada) => {
      if (jornada.key === editingKey) {
        return false;
      }

      return jornada.key === key || jornada.label.toLowerCase() === label.toLowerCase();
    });

    if (duplicate) {
      toast.error('Ya existe una jornada con ese nombre.');
      return;
    }

    const nextJornadas = (() => {
      if (editingKey) {
        return sortedJornadas.map((jornada) => {
          if (jornada.key !== editingKey) {
            return jornada;
          }

          return {
            ...jornada,
            label,
            descripcion,
            horasMinimasSemanales,
            horasMaximasSemanales,
            aplicaAContratos: form.aplicaAContratos,
            patternSemanal: cloneJornadaPattern(form.patternSemanal),
          };
        });
      }

      const nextOrder = sortedJornadas.length > 0 ? Math.max(...sortedJornadas.map((jornada) => jornada.orden || 0)) + 1 : 1;

      return [
        ...sortedJornadas,
        {
          key,
          label,
          descripcion,
          horasMinimasSemanales,
          horasMaximasSemanales,
          aplicaAContratos: form.aplicaAContratos,
          patternSemanal: cloneJornadaPattern(form.patternSemanal),
          orden: nextOrder,
          editable: true,
        },
      ];
    })();

    try {
      setSaving(true);
      await saveJornadasTrabajo(nextJornadas);

      const detail = editingKey
        ? `Se actualizó "${label}" con una plantilla de ${totalHoras} horas.`
        : `Se creó "${label}" con una plantilla de ${totalHoras} horas.`;

      toast.success({
        title: editingKey ? 'Jornada actualizada' : 'Jornada creada',
        description: detail,
        duration: 6000,
        position: 'top-center',
        fill: HIGHLIGHT_BLUE,
        styles: {
          title: 'sileo-title-dark',
          description: 'sileo-description-dark',
          badge: 'sileo-badge-hidden',
        },
      });

      setFeedback({ type: 'success', text: detail });

      if (editingKey) {
        closeEditModal();
      } else {
        closeCreateModal();
      }
    } catch (error) {
      const message = `No se pudo guardar la jornada: ${error.message}`;
      setFeedback({ type: 'error', text: message });
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingJornadas) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="body2" color="text.secondary">
          Cargando catálogo de jornadas de trabajo...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        Jornadas de Trabajo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Define plantillas semanales reutilizables para estandarizar y acelerar la creación de horarios.
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          mb: 2.5,
          borderRadius: 2,
          overflow: 'hidden',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          backgroundColor: '#ffffff',
        }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
            1. Tipos de Jornadas Ordinarias
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Esta tabla se puede editar directamente y sirve como referencia visual para valorar correctamente las horas capturadas por día.
          </Typography>
        </Box>

        <Box sx={{ px: 2, pb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleSaveJornadasOrdinarias}
            disabled={savingOrdinarias || loadingJornadasOrdinarias}
            startIcon={<SaveIcon />}
          >
            Guardar cambios
          </Button>
        </Box>

        <TableContainer>
          <Table size="small" aria-label="Tipos de jornadas ordinarias">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                  Tipo de Jornada
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                  Horario de Cobertura
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                  Límite Diario
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                  Límite Semanal
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jornadasOrdinariasDraft.map((row) => (
                <TableRow key={row.key} hover sx={{ '&:last-child td': { borderBottom: 'none' } }}>
                  <TableCell sx={{ fontWeight: 700, color: '#1f2937', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <TextField
                      fullWidth
                      variant="standard"
                      value={row.tipo}
                      onChange={(event) => updateJornadaOrdinariaDraft(row.key, 'tipo', event.target.value)}
                      InputProps={{ disableUnderline: true, sx: { fontWeight: 700, color: '#1f2937' } }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#374151', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                      <TextField
                        label="Desde"
                        type="time"
                        variant="standard"
                        value={row.coberturaInicio}
                        onChange={(event) => updateJornadaOrdinariaDraft(row.key, 'coberturaInicio', event.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label="Hasta"
                        type="time"
                        variant="standard"
                        value={row.coberturaFin}
                        onChange={(event) => updateJornadaOrdinariaDraft(row.key, 'coberturaFin', event.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatCoberturaJornadaOrdinaria(row)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: '#374151', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <TextField
                      fullWidth
                      variant="standard"
                      type="number"
                      value={row.limiteDiario}
                      onChange={(event) => updateJornadaOrdinariaDraft(row.key, 'limiteDiario', event.target.value)}
                      inputProps={{ min: 1, step: 1 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#374151', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <TextField
                      fullWidth
                      variant="standard"
                      type="number"
                      value={row.limiteSemanal}
                      onChange={(event) => updateJornadaOrdinariaDraft(row.key, 'limiteSemanal', event.target.value)}
                      inputProps={{ min: 1, step: 1 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        La plantilla debe respetar el rango semanal y puede limitarse a uno o varios tipos de contrato.
      </Alert>

      {feedback && (
        <Alert
          severity={feedback.type}
          sx={{
            mb: 2,
            borderRadius: 2,
            backgroundColor: HIGHLIGHT_BLUE,
            color: '#1e3a8a',
            '& .MuiAlert-icon': {
              color: '#2563eb',
            },
          }}
          onClose={() => setFeedback(null)}
        >
          {feedback.text}
        </Alert>
      )}

      <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal} sx={{ mb: 2 }}>
        Crear jornada
      </Button>

      <Dialog open={createModalOpen} onClose={closeCreateModal} fullWidth maxWidth="md">
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Crear nueva jornada de trabajo
          <Button
            onClick={closeCreateModal}
            aria-label="Cerrar creación"
            sx={{ position: 'absolute', right: 8, top: 8, minWidth: 0, p: 1 }}
          >
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nombre de la jornada"
              value={form.label}
              onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
              helperText="Ejemplo: Jornada Operativa 48h"
            />
            <TextField
              fullWidth
              label="Descripción"
              value={form.descripcion}
              onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
              helperText="Resume cuándo se aplica esta plantilla"
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Horas mínimas semanales"
                type="number"
                value={form.horasMinimasSemanales}
                onChange={(event) => setForm((current) => ({ ...current, horasMinimasSemanales: event.target.value }))}
                inputProps={{ min: 1, step: 1 }}
              />
              <TextField
                fullWidth
                label="Horas máximas semanales"
                type="number"
                value={form.horasMaximasSemanales}
                onChange={(event) => setForm((current) => ({ ...current, horasMaximasSemanales: event.target.value }))}
                inputProps={{ min: 1, step: 1 }}
              />
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Aplica a contratos</InputLabel>
              <Select
                multiple
                value={form.aplicaAContratos}
                onChange={(event) => setForm((current) => ({ ...current, aplicaAContratos: event.target.value }))}
                input={<OutlinedInput label="Aplica a contratos" />}
                renderValue={(selected) => {
                  if (!selected || selected.length === 0) {
                    return 'Todos los contratos';
                  }

                  return selected
                    .map((key) => {
                      const option = sanitizedContractOptions.find((candidate) => candidate.key === key);

                      return option ? `${option.label} (${option.hours})` : key;
                    })
                    .join(', ');
                }}
              >
                {sanitizedContractOptions.map((option) => (
                  <MenuItem key={option.key} value={option.key}>
                    <Checkbox checked={form.aplicaAContratos.includes(option.key)} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {option.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.hours}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -1 }}>
              Rango actual: {formatAppliedContracts(form.aplicaAContratos)}
            </Typography>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Patrón semanal
            </Typography>

            <Stack spacing={1.5}>
              {JORNADAS_DIAS.map((dia) => {
                const dayValue = form.patternSemanal[dia] || createEmptyJornadaPattern()[dia];
                const requiresHours = !isNoHoursType(dayValue.tipo);

                return (
                  <Paper
                    key={dia}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      borderColor: alpha('#2563eb', 0.12),
                    }}
                  >
                    <Grid container spacing={1.5} alignItems="center">
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {JORNADAS_DIAS_LABELS[dia]}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel>Tipo</InputLabel>
                          <Select
                            value={dayValue.tipo}
                            onChange={(event) => handleDayChange(dia, 'tipo', event.target.value)}
                            label="Tipo"
                          >
                            {tiposHorario.map((tipoHorario) => (
                              <MenuItem key={tipoHorario.key} value={tipoHorario.key}>
                                {tipoHorario.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth
                          label="Inicio"
                          type="time"
                          value={dayValue.horaInicio}
                          onChange={(event) => handleDayChange(dia, 'horaInicio', event.target.value)}
                          InputLabelProps={{ shrink: true }}
                          disabled={!requiresHours}
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth
                          label="Fin"
                          type="time"
                          value={dayValue.horaFin}
                          onChange={(event) => handleDayChange(dia, 'horaFin', event.target.value)}
                          InputLabelProps={{ shrink: true }}
                          disabled={!requiresHours}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })}
            </Stack>

            <Chip
              label={`${form.label || 'Vista previa'}${calcularHorasJornadaTrabajo(form.patternSemanal) ? ` · ${calcularHorasJornadaTrabajo(form.patternSemanal)}h` : ''}`}
              sx={{ border: '1px solid rgba(37, 99, 235, 0.24)', fontWeight: 600, alignSelf: 'flex-start' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeCreateModal} disabled={saving} variant="outlined">
            Cancelar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleSave} disabled={saving}>
            Crear jornada
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editModalOpen} onClose={closeEditModal} fullWidth maxWidth="md">
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Editar jornada de trabajo
          <Button
            onClick={closeEditModal}
            aria-label="Cerrar edición"
            sx={{ position: 'absolute', right: 8, top: 8, minWidth: 0, p: 1 }}
          >
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nombre de la jornada"
              value={form.label}
              disabled
              helperText="La clave no se modifica desde aquí"
            />
            <TextField
              fullWidth
              label="Descripción"
              value={form.descripcion}
              onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Horas mínimas semanales"
                type="number"
                value={form.horasMinimasSemanales}
                onChange={(event) => setForm((current) => ({ ...current, horasMinimasSemanales: event.target.value }))}
                inputProps={{ min: 1, step: 1 }}
              />
              <TextField
                fullWidth
                label="Horas máximas semanales"
                type="number"
                value={form.horasMaximasSemanales}
                onChange={(event) => setForm((current) => ({ ...current, horasMaximasSemanales: event.target.value }))}
                inputProps={{ min: 1, step: 1 }}
              />
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Aplica a contratos</InputLabel>
              <Select
                multiple
                value={form.aplicaAContratos}
                onChange={(event) => setForm((current) => ({ ...current, aplicaAContratos: event.target.value }))}
                input={<OutlinedInput label="Aplica a contratos" />}
                renderValue={(selected) => {
                  if (!selected || selected.length === 0) {
                    return 'Todos los contratos';
                  }

                  return selected
                    .map((key) => {
                      const option = sanitizedContractOptions.find((candidate) => candidate.key === key);

                      return option ? `${option.label} (${option.hours})` : key;
                    })
                    .join(', ');
                }}
              >
                {sanitizedContractOptions.map((option) => (
                  <MenuItem key={option.key} value={option.key}>
                    <Checkbox checked={form.aplicaAContratos.includes(option.key)} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {option.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.hours}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -1 }}>
              Rango actual: {formatAppliedContracts(form.aplicaAContratos)}
            </Typography>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Patrón semanal
            </Typography>

            <Stack spacing={1.5}>
              {JORNADAS_DIAS.map((dia) => {
                const dayValue = form.patternSemanal[dia] || createEmptyJornadaPattern()[dia];
                const requiresHours = !isNoHoursType(dayValue.tipo);

                return (
                  <Paper
                    key={dia}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      borderColor: alpha('#2563eb', 0.12),
                    }}
                  >
                    <Grid container spacing={1.5} alignItems="center">
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {JORNADAS_DIAS_LABELS[dia]}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel>Tipo</InputLabel>
                          <Select
                            value={dayValue.tipo}
                            onChange={(event) => handleDayChange(dia, 'tipo', event.target.value)}
                            label="Tipo"
                          >
                            {tiposHorario.map((tipoHorario) => (
                              <MenuItem key={tipoHorario.key} value={tipoHorario.key}>
                                {tipoHorario.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth
                          label="Inicio"
                          type="time"
                          value={dayValue.horaInicio}
                          onChange={(event) => handleDayChange(dia, 'horaInicio', event.target.value)}
                          InputLabelProps={{ shrink: true }}
                          disabled={!requiresHours}
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth
                          label="Fin"
                          type="time"
                          value={dayValue.horaFin}
                          onChange={(event) => handleDayChange(dia, 'horaFin', event.target.value)}
                          InputLabelProps={{ shrink: true }}
                          disabled={!requiresHours}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })}
            </Stack>

            <Chip
              label={`${form.label || 'Vista previa'}${calcularHorasJornadaTrabajo(form.patternSemanal) ? ` · ${calcularHorasJornadaTrabajo(form.patternSemanal)}h` : ''}`}
              sx={{ border: '1px solid rgba(37, 99, 235, 0.24)', fontWeight: 600, alignSelf: 'flex-start' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeEditModal} disabled={saving} variant="outlined">
            Cancelar
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>

      <Divider sx={{ my: 2.5 }} />

      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
        Catálogo actual ({sortedJornadas.length})
      </Typography>

      <Stack spacing={1.25}>
        {sortedJornadas.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Todavía no hay jornadas creadas.
          </Alert>
        ) : (
          sortedJornadas.map((jornada) => (
            <Paper
              key={jornada.key}
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 2,
                borderColor: alpha('#2563eb', 0.18),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                  {jornada.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {jornada.descripcion || jornada.key}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                  {formatJornadaTrabajoResumen(jornada)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                  Contratos: {formatAppliedContracts(jornada.aplicaAContratos)}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, flexWrap: 'wrap' }}>
                <Chip size="small" label={`${calcularHorasJornadaTrabajo(jornada.patternSemanal)}h`} color="primary" variant="outlined" />
                <Chip
                  size="small"
                  label={formatAppliedContracts(jornada.aplicaAContratos)}
                  variant="outlined"
                />
                {!jornada.editable && <Chip size="small" label="Base" color="success" variant="outlined" />}
                <Button size="small" startIcon={<EditIcon />} onClick={() => handleEdit(jornada)}>
                  Editar
                </Button>
              </Stack>
            </Paper>
          ))
        )}
      </Stack>
    </Box>
  );
};

export default JornadasManager;
