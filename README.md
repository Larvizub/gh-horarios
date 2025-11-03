# App Horarios - Costa Rica CC

Una aplicación web moderna para la gestión de horarios de empleados en Costa Rica CC. Permite a los administradores y empleados gestionar, editar y consultar horarios de trabajo de manera eficiente y en tiempo real.

## 🚀 Características Principales

- **Gestión de Horarios**: Crear, editar y eliminar horarios por semana y usuario.
- **Sincronización en Tiempo Real**: Actualizaciones automáticas usando Firebase Realtime Database.
- **Control de Acceso**: Sistema de roles (Administrador, Modificador, Usuario) con permisos granulares.
- **Cálculo Automático de Horas Extras**: Detección y cálculo de horas extras basado en contratos.
- **Interfaz Responsiva**: Diseño moderno y adaptable a móviles y tablets.
- **Recomendaciones Inteligentes**: Sugerencias para asignar horas a practicantes disponibles.
- **Backup Automático**: Sistema de respaldo para operaciones críticas.

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 con Material-UI (MUI)
- **Backend**: Firebase Realtime Database
- **Autenticación**: Firebase Authentication
- **Estado**: Context API de React
- **Rutas**: React Router DOM
- **Gestión de Estado**: Hooks personalizados
- **Build Tool**: Create React App
- **Gestor de Paquetes**: pnpm / npm

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- pnpm o npm
- Cuenta de Firebase con proyecto configurado

## 🔧 Instalación y Configuración

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/Larvizub/gh-horarios.git
   cd gh-horarios
   ```

2. **Instala las dependencias**:
   ```bash
   pnpm install
   # o si usas npm
   npm install
   ```

3. **Configura las variables de entorno**:
   Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```
   REACT_APP_FIREBASE_API_KEY=tu_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=tu_auth_domain
   REACT_APP_FIREBASE_DATABASE_URL=tu_database_url
   REACT_APP_FIREBASE_PROJECT_ID=tu_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=tu_app_id
   ```

4. **Configura Firebase**:
   - Sube las reglas de seguridad (`rulesFirebase.json`) a tu proyecto Firebase.
   - Asegúrate de que la Realtime Database esté habilitada.

## 🚀 Ejecutar la Aplicación

### Modo Desarrollo
```bash
pnpm start
# o
npm start
```

La aplicación estará disponible en `http://localhost:3000`.

### Build de Producción
```bash
pnpm run build
# o
npm run build
```

## 📱 Uso de la Aplicación

### Roles de Usuario
- **Administrador**: Acceso completo a todas las funciones, incluyendo eliminación de horarios de cualquier usuario.
- **Modificador**: Puede editar horarios de todos los usuarios, pero con restricciones en eliminaciones.
- **Usuario**: Solo puede gestionar sus propios horarios.

### Funciones Principales
1. **Dashboard**: Vista general del estado de horarios.
2. **Horarios**: Gestión semanal de horarios con edición en tiempo real.
3. **Consulta**: Búsqueda y visualización de horarios históricos.
4. **Personal**: Gestión de usuarios y contratos.
5. **Configuración**: Ajustes del sistema.

### Gestión de Horarios
- Selecciona una semana para ver/editar horarios.
- Usa el modo "Editar Horarios" para hacer cambios.
- El sistema calcula automáticamente horas extras.
- Recibe recomendaciones para asignar horas a practicantes.

## 🔒 Seguridad

- Autenticación obligatoria para acceder a la aplicación.
- Control de permisos basado en roles.
- Validación de datos en cliente y servidor.
- Backup automático de operaciones críticas.

## 🐛 Reporte de Problemas

Si encuentras algún problema o tienes sugerencias, por favor crea un issue en el repositorio de GitHub.

## 📄 Licencia

Este proyecto es propiedad de Costa Rica CC. Todos los derechos reservados.

## 👥 Contribuidores

- Desarrollado por el equipo de TI de Costa Rica CC.

---

**Nota**: Asegúrate de mantener las variables de entorno seguras y no subirlas al repositorio. El archivo `.gitignore` ya está configurado para excluir archivos sensibles.