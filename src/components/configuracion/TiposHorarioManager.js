import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import { alpha } from '@mui/material/styles';
import { notify as toast } from '../../services/notify';
import useTiposHorario from '../../hooks/useTiposHorario';
import { saveTiposHorario } from '../../services/tiposHorarioService';
import {
  getTipoIconComponent,
  sanitizeTipoKey,
  TIPO_ICON_OPTIONS,
  TIPO_TEMPLATES
} from '../../utils/tiposHorario';

const TEMPLATES_OPTIONS = [
  { value: TIPO_TEMPLATES.SIMPLE, label: 'Horario simple (inicio-fin)' },
  { value: TIPO_TEMPLATES.SIN_HORAS, label: 'Sin horas (solo etiqueta)' },
  { value: TIPO_TEMPLATES.TARDE_LIBRE, label: 'Media jornada libre' },
  { value: TIPO_TEMPLATES.TELE_MEDIA_LIBRE, label: 'Teletrabajo + media jornada libre' },
  { value: TIPO_TEMPLATES.TELE_PRESENCIAL, label: 'Teletrabajo + presencial' },
  { value: TIPO_TEMPLATES.HORARIO_DIVIDIDO, label: 'Horario dividido' },
  { value: TIPO_TEMPLATES.VIAJE_TRABAJO, label: 'Viaje de trabajo (08:00 - 18:00)' }
];

const EMPTY_FORM = {
  key: '',
  label: '',
  icon: 'Work',
  color: '#00830e',
  template: TIPO_TEMPLATES.SIMPLE,
  noSumaHoras: false
};

const TiposHorarioManager = () => {
  const { tipos, loadingTipos } = useTiposHorario();
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const sortedTipos = useMemo(() => {
    return [...tipos].sort((a, b) => a.orden - b.orden);
  }, [tipos]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingKey(null);
  };

  const handleKeyChange = (event) => {
    setForm((prev) => ({
      ...prev,
      key: sanitizeTipoKey(event.target.value)
    }));
  };

  const handleEdit = (tipo) => {
    setEditingKey(tipo.key);
    setForm({
      key: tipo.key,
      label: tipo.label,
      icon: tipo.icon,
      color: tipo.color,
      template: tipo.template,
      noSumaHoras: Boolean(tipo.noSumaHoras)
    });
  };

  const handleSave = async () => {
    if (!form.key || !form.label) {
      toast.error('La clave y la etiqueta son obligatorias.');
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(form.color)) {
      toast.error('El color debe ser hexadecimal, por ejemplo: #00830e');
      return;
    }

    try {
      setSaving(true);
      const found = sortedTipos.find((tipo) => tipo.key === form.key);
      const existsAndNotEditing = Boolean(found && found.key !== editingKey);

      if (existsAndNotEditing) {
        toast.error('La clave ya existe. Usa una diferente.');
        return;
      }

      const nextTipos = (() => {
        if (editingKey) {
          return sortedTipos.map((tipo) => {
            if (tipo.key !== editingKey) return tipo;
            return {
              ...tipo,
              label: form.label,
              icon: form.icon,
              color: form.color,
              template: form.template,
              noSumaHoras: form.noSumaHoras
            };
          });
        }

        const nextOrder = sortedTipos.length > 0 ? Math.max(...sortedTipos.map((t) => t.orden || 0)) + 1 : 1;
        return [
          ...sortedTipos,
          {
            key: form.key,
            label: form.label,
            icon: form.icon,
            color: form.color,
            template: form.template,
            noSumaHoras: form.noSumaHoras,
            orden: nextOrder,
            editable: true
          }
        ];
      })();

      await saveTiposHorario(nextTipos);
      toast.success(editingKey ? 'Tipo actualizado correctamente.' : 'Tipo creado correctamente.');
      resetForm();
    } catch (error) {
      toast.error(`No se pudo guardar el tipo: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tipo) => {
    if (!tipo.editable) {
      toast.error('Los tipos predeterminados no se pueden eliminar.');
      return;
    }

    try {
      setSaving(true);
      const nextTipos = sortedTipos.filter((item) => item.key !== tipo.key);
      await saveTiposHorario(nextTipos);
      toast.success('Tipo eliminado correctamente.');
      if (editingKey === tipo.key) {
        resetForm();
      }
    } catch (error) {
      toast.error(`No se pudo eliminar el tipo: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loadingTipos) {
    return (
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Typography variant="body2" color="text.secondary">Cargando catálogo de tipos...</Typography>
      </Paper>
    );
  }

  const PreviewIcon = getTipoIconComponent(form.icon);

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        Tipos de Horario
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Aquí puedes crear tipos nuevos y editar sus etiquetas, iconos, color y comportamiento de horas.
      </Typography>

      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        Los tipos base del sistema se pueden editar, pero no eliminar.
      </Alert>

      <Box sx={{ p: 2, borderRadius: 2, backgroundColor: alpha('#00830e', 0.04), border: '1px solid rgba(0, 131, 14, 0.12)' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Clave"
              value={form.key}
              onChange={handleKeyChange}
              disabled={Boolean(editingKey)}
              helperText="Ejemplo: capacitacion-interna"
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Etiqueta"
              value={form.label}
              onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
              helperText="Texto que verá el usuario"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Icono</InputLabel>
              <Select
                value={form.icon}
                label="Icono"
                onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
              >
                {TIPO_ICON_OPTIONS.map((iconOption) => (
                  <MenuItem key={iconOption.value} value={iconOption.value}>{iconOption.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Color"
              value={form.color}
              onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
              helperText="Formato hexadecimal #RRGGBB"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Plantilla</InputLabel>
              <Select
                value={form.template}
                label="Plantilla"
                onChange={(event) => setForm((prev) => ({ ...prev, template: event.target.value }))}
              >
                {TEMPLATES_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.noSumaHoras}
                    onChange={(event) => setForm((prev) => ({ ...prev, noSumaHoras: event.target.checked }))}
                  />
                }
                label="No suma horas"
              />
              <Chip
                icon={<PreviewIcon style={{ color: form.color }} />}
                label={form.label || 'Vista previa'}
                sx={{ border: `1px solid ${alpha(form.color, 0.4)}`, fontWeight: 600 }}
              />
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                startIcon={editingKey ? <SaveIcon /> : <AddIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {editingKey ? 'Guardar Cambios' : 'Crear Tipo'}
              </Button>
              {editingKey && (
                <Button variant="outlined" onClick={resetForm} disabled={saving}>
                  Cancelar Edición
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 2.5 }} />

      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
        Catálogo actual ({sortedTipos.length})
      </Typography>
      <Stack spacing={1.25}>
        {sortedTipos.map((tipo) => {
          const Icon = getTipoIconComponent(tipo.icon);
          return (
            <Paper
              key={tipo.key}
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 2,
                borderColor: alpha(tipo.color || '#00830e', 0.3),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                <Icon sx={{ color: tipo.color || '#00830e' }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {tipo.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tipo.key}
                  </Typography>
                </Box>
                {tipo.noSumaHoras && (
                  <Chip size="small" label="No suma horas" color="default" />
                )}
                {!tipo.editable && (
                  <Chip size="small" label="Base" color="success" variant="outlined" />
                )}
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleEdit(tipo)}>
                  Editar
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteOutlineIcon />}
                  disabled={!tipo.editable}
                  onClick={() => handleDelete(tipo)}
                >
                  Eliminar
                </Button>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default TiposHorarioManager;
