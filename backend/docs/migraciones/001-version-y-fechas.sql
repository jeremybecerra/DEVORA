-- Migración 001 · Para bases creadas con la primera versión de docs/esquema-mysql.sql.
-- Si creas la base desde cero con el esquema actual, NO hace falta ejecutar este archivo.
--
-- Cambios:
--   1. pedidos.version: control de concurrencia optimista (dos cambios simultáneos ya no se pisan).
--   2. pedidos.clave_idempotencia: 100 caracteres (la clave ahora incluye el id del comensal).
--   3. Fechas con milisegundos, guardadas en UTC por la aplicación.

USE devora;

ALTER TABLE pedidos
  ADD COLUMN version INT UNSIGNED NOT NULL DEFAULT 1 AFTER total,
  MODIFY clave_idempotencia VARCHAR(100) NULL,
  MODIFY creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  MODIFY actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

ALTER TABLE comensales
  MODIFY creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
