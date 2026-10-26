# Sigchos Booking Project (WIP)

Proyecto de sistema de reservas para Sigchos. 

> **Estado:** En desarrollo. Actualmente implementando módulos de autenticación y gestión de usuarios.


## Requisitos

- Java 21
- Maven 3.8.1 o superior
- PostgreSQL 12+
- Git

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/MateoCondor/sigchos-booking-project
cd sigchos-booking-project
```

2. Configurar base de datos PostgreSQL:
```sql
CREATE DATABASE sigchos_booking_db;
```

3. Compilar el proyecto:
```bash
cd sigchos-booking-backend
mvn clean install
```

4. Ejecutar la aplicación:
```bash
mvn spring-boot:run
```

La aplicación estará disponible en `http://localhost:8080/api`


## Configuración

### Variables de Entorno (application.properties)

```properties
# Base de datos
spring.datasource.url=jdbc:postgresql://localhost:5432/sigchos_booking_db
spring.datasource.username=postgres
spring.datasource.password=postgres

# JWT
app.jwt.secret=<base64-encoded-32-byte-secret>
app.jwt.expiration-ms=86400000

# Bootstrap SYSTEM_ADMIN (dejar vacío para desactivar)
app.bootstrap.system-admin.email=admin@sigchos.local
app.bootstrap.system-admin.password=ChangeMe123!
```


## Módulos Implementados (WIP)

### 1. Auth (Autenticación y Seguridad)
- **Endpoints:**
  - `POST /auth/register` - Registro de nuevos usuarios (rol CLIENT por defecto)
  - `POST /auth/login` - Login con email y contraseña
- **Características:**
  - JWT (JSON Web Tokens) para autenticación stateless
  - Contraseñas hasheadas con BCrypt
  - Bootstrap automático de SYSTEM_ADMIN en primer arranque

### 2. User (Gestión de Usuarios)
- **Endpoints:**
  - `GET /profile` - Ver perfil del usuario autenticado
  - `PUT /profile` - Editar datos propios (solo usuario autenticado)
  - `GET /admin/users` - Listar todos los usuarios (SYSTEM_ADMIN)
  - `POST /admin/users` - Crear nuevo usuario (SYSTEM_ADMIN)
  - `PUT /admin/users/{id}` - Editar usuario (SYSTEM_ADMIN)
- **Datos de Usuario:**
  - Nombre y apellido
  - Email (único)
  - Contraseña
  - Teléfono
  - Fecha de nacimiento
  - Rol (CLIENT, SYSTEM_ADMIN, ESTABLISHMENT_ADMIN)
  - Estado activo/inactivo

### 3. Role (Roles y Permisos)
- **Roles disponibles:**
  - `CLIENT` - Usuario cliente, acceso solo a su perfil
  - `SYSTEM_ADMIN` - Administrador del sistema, gestión de usuarios
  - `ESTABLISHMENT_ADMIN` - Administrador de hotel (preparado para futuro)


## Desarrolladores

Este proyecto está siendo desarrollado por Mateo Condor y Alexander Guacan.
