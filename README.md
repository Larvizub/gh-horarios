# App Horarios - Costa Rica CC

Aplicación web para gestión integral de horarios semanales del personal, con control de acceso por roles, cálculo de horas, recomendaciones operativas y consulta histórica.

## Objetivo

Centralizar la planificación y seguimiento de turnos por semana para:

- Asignar jornadas por usuario y día.
- Controlar límites semanales según tipo de contrato.
- Detectar exceso de horas y apoyar redistribución.
- Consultar históricos y exportar reportes.

## Funcionalidades

### 1) Autenticación y acceso

- Inicio de sesión y registro con Firebase Authentication.
- Rutas protegidas por sesión activa.
- Carga de permisos desde datos de usuario en Realtime Database.

### 2) Roles y permisos

Roles principales:

- **Administrador**
   - Acceso total.
   - Puede modificar horarios de cualquier usuario.
- **Modificador**
   - Puede modificar horarios de su departamento (y según reglas aplicadas en módulo de horarios).
- **Visor**
   - Acceso de consulta sin modificaciones.

Reglas adicionales:

- Personal de **Talento Humano** tiene permisos extendidos para gestión de personal/contratos.
- El menú de navegación se filtra según permisos (`Horarios`, `Consulta`, `Personal`).

### 3) Módulo Dashboard

- Resumen de horas de la semana actual.
- Visualización de horas extras acumuladas.
- Distribución por tipo de turno y gráficos históricos.
- Indicadores de disponibilidad de horas por contrato.

### 4) Módulo Horarios (gestión semanal)

- Navegación por semana.
- Modo edición con guardado por lote.
- Edición por celda usuario/día.
- Copiar y pegar turnos (incluye pegado múltiple a varios destinos).
- Eliminación de horarios (según permisos).
- Recalculo de horas extras al guardar/eliminar.
- Recomendaciones automáticas de compañeros/practicantes disponibles cuando hay exceso.

### 5) Tipos de turno soportados

- Presencial (`personalizado`)
- Teletrabajo
- Teletrabajo & Presencial (`tele-presencial`)
- **Horario Dividido** (`horario-dividido`) ✅
   - Dos bloques en el mismo día.
   - Suma automática de horas de ambos bloques.
- Visita Comercial
- Cambio
- Media Jornada Libre (`tarde-libre`)
- Teletrabajo & Media Jornada Libre (`tele-media-libre`)
- Media Jornada Libre & Mes de cumpleaños (`media-cumple`)
- Descanso
- Vacaciones
- Feriado
- Permiso
- Día por Brigada
- Día libre - beneficio operaciones
- Fuera de Oficina
- Viaje de Trabajo
- Incapacidad por Enfermedad
- Incapacidad por Accidente

### 6) Cálculo de horas y restricciones

- Cálculo de horas por turno (incluye cruce de medianoche).
- Cálculo semanal por usuario.
- Límite semanal por contrato:
   - **Operativo**: 48h
   - **Confianza**: 72h
- Registro y lectura de horas extras en `horas_extras`.

### 7) Módulo Consulta de Horarios

- Consulta histórica por semana/usuario/departamento.
- Vista tabular y móvil.
- Formateo detallado por tipo de turno.
- Exportación a Excel (`xlsx`).

### 8) Módulo Personal

- Gestión de usuarios del sistema.
- Visualización de rol, departamento y tipo de contrato.
- Cambio de tipo de contrato según permisos.

### 9) Módulo Configuración

- Ajuste de datos de usuario y configuración operativa.
- Gestión de rol y tipo de contrato (con validaciones de permiso).

### 10) Persistencia y sincronización

- Sincronización en tiempo real con Firebase Realtime Database.
- Suscripciones por semana y por usuarios específicos.
- Escrituras con `update` granular para reducir sobrescrituras concurrentes.
- Guardado con reintentos en operaciones críticas.
- Respaldo de payload en `horarios_backups` durante guardados batch.

## Stack tecnológico

- **Frontend**: React 18 + Vite
- **UI**: Material UI (MUI)
- **Routing**: React Router DOM
- **Estado**: Context API + hooks personalizados
- **Datos**: Firebase Realtime Database
- **Auth**: Firebase Authentication
- **Gráficos**: Recharts
- **Exportación**: xlsx
- **Cloud Functions**: Firebase Functions (Node 20)

## Estructura principal

- `src/components/auth`: login/registro/rutas protegidas.
- `src/components/dashboard`: métricas e indicadores.
- `src/components/horarios`: planificación y edición semanal.
- `src/components/consulta`: consulta histórica y exportación.
- `src/components/personal`: administración de personal.
- `src/components/configuracion`: configuración de usuarios/sistema.
- `src/services`: acceso a Firebase y notificaciones.
- `src/utils`: constantes, permisos y cálculos.
- `functions`: Cloud Functions para operaciones backend.

## Requisitos

- Node.js 20+ recomendado.
- pnpm (recomendado) o npm.
- Proyecto Firebase con Authentication y Realtime Database habilitados.

## Instalación

1. Clonar repositorio:

```bash
git clone https://github.com/Larvizub/gh-horarios.git
cd gh-horarios
```

2. Instalar dependencias:

```bash
pnpm install
```

3. Configurar variables de entorno en `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

4. Aplicar reglas de base de datos (`rulesFirebase.json`) en Firebase.

## Scripts (frontend)

```bash
pnpm dev       # desarrollo
pnpm build     # build producción
pnpm preview   # previsualizar build
```

## Scripts (Cloud Functions)

Desde `functions/`:

```bash
pnpm install
npm run serve   # emulador functions
npm run deploy  # despliegue functions
npm run logs    # logs functions
```

## Despliegue Firebase Hosting

El proyecto usa:

- `firebase.json` con `public: build`
- Rewrite SPA de `**` hacia `/index.html`

Flujo típico:

```bash
pnpm build
firebase deploy --only hosting
```

## Notas operativas

- El módulo de horarios y consulta depende de una estructura consistente en `horarios_registros/{semana}/{usuario}/{dia}`.
- Evita subir `.env` al repositorio.
- Para cambios de permisos, valida siempre rol + departamento en los módulos de `Personal` y `Configuración`.

## Licencia

Proyecto interno de Costa Rica CC. Todos los derechos reservados.