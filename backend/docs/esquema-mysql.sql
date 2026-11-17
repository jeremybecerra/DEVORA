-- Esquema que espera el repositorio MySQL del backend (src/repositories/mysql/index.js).
-- Es el contrato entre el backend y la persistencia: si se cambia un nombre de tabla o columna,
-- hay que actualizar también las consultas del repositorio.

CREATE DATABASE IF NOT EXISTS devora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE devora;

CREATE TABLE IF NOT EXISTS mesas (
  id      VARCHAR(20)  NOT NULL,
  nombre  VARCHAR(60)  NOT NULL,
  estado  ENUM('abierta', 'cerrada') NOT NULL DEFAULT 'abierta',
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS productos (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre           VARCHAR(80)   NOT NULL,
  descripcion      VARCHAR(255)  NOT NULL DEFAULT '',
  categoria        VARCHAR(40)   NOT NULL,
  precio           DECIMAL(10,2) NOT NULL,
  disponible       TINYINT(1)    NOT NULL DEFAULT 1,
  imagen_url       VARCHAR(255)  NOT NULL DEFAULT '',
  tiempo_estimado  TINYINT UNSIGNED NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_productos_precio CHECK (precio >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comensales (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  mesa_id    VARCHAR(20)  NOT NULL,
  nombre     VARCHAR(40)  NOT NULL,
  creado_en  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_comensales_mesa (mesa_id),
  CONSTRAINT fk_comensales_mesa FOREIGN KEY (mesa_id) REFERENCES mesas (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedidos (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  mesa_id             VARCHAR(20)   NOT NULL,
  comensal_id         INT UNSIGNED  NOT NULL,
  estado              ENUM('recibido', 'en_preparacion', 'listo', 'entregado', 'cancelado') NOT NULL DEFAULT 'recibido',
  total               DECIMAL(10,2) NOT NULL,
  version             INT UNSIGNED  NOT NULL DEFAULT 1,
  clave_idempotencia  VARCHAR(100)  NULL,
  creado_en           DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pedidos_clave (clave_idempotencia),
  KEY idx_pedidos_mesa (mesa_id, creado_en),
  CONSTRAINT fk_pedidos_mesa FOREIGN KEY (mesa_id) REFERENCES mesas (id),
  CONSTRAINT fk_pedidos_comensal FOREIGN KEY (comensal_id) REFERENCES comensales (id),
  CONSTRAINT chk_pedidos_total CHECK (total >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS detalles_pedido (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  pedido_id        INT UNSIGNED  NOT NULL,
  producto_id      INT UNSIGNED  NOT NULL,
  nombre_producto  VARCHAR(80)   NOT NULL,
  cantidad         SMALLINT UNSIGNED NOT NULL,
  precio_unitario  DECIMAL(10,2) NOT NULL,
  subtotal         DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_detalle_producto (pedido_id, producto_id),
  CONSTRAINT fk_detalles_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
  CONSTRAINT fk_detalles_producto FOREIGN KEY (producto_id) REFERENCES productos (id),
  CONSTRAINT chk_detalles_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB;

-- Datos de prueba (los mismos que usa el modo en memoria).
INSERT IGNORE INTO mesas (id, nombre, estado) VALUES
  ('01', 'Mesa 01', 'abierta'), ('02', 'Mesa 02', 'abierta'), ('03', 'Mesa 03', 'abierta'), ('04', 'Mesa 04', 'abierta'),
  ('05', 'Mesa 05', 'abierta'), ('06', 'Mesa 06', 'abierta'), ('07', 'Mesa 07', 'abierta'), ('08', 'Mesa 08', 'cerrada');

INSERT IGNORE INTO productos (id, nombre, descripcion, categoria, precio, disponible, imagen_url, tiempo_estimado) VALUES
  (1, 'Silpancho', 'Carne apanada, arroz, papa, huevo y salsa criolla.', 'Platos principales', 35.00, 1, '', 15),
  (2, 'Pique macho', 'Carne de res, salchicha, papas, tomate, cebolla y locoto.', 'Platos principales', 52.00, 1, '', 18),
  (3, 'Sopa de maní', 'Sopa tradicional con fideo, papa frita y perejil.', 'Platos principales', 22.00, 1, '', 10),
  (4, 'Salteña de pollo', 'Unidad, horneada al momento.', 'Entradas', 8.00, 1, '', 6),
  (5, 'Limonada', 'Vaso de 500 ml, limón recién exprimido.', 'Bebidas', 12.00, 1, '', 5),
  (6, 'Mocochinchi', 'Vaso de 500 ml con durazno deshidratado y canela.', 'Bebidas', 8.00, 1, '', 4),
  (7, 'Agua sin gas', 'Botella de 500 ml.', 'Bebidas', 6.00, 1, '', 2),
  (8, 'Api con pastel', 'Api morado caliente con pastel de queso.', 'Postres', 15.00, 1, '', 8),
  (9, 'Helado de canela', 'Dos bolas de helado artesanal.', 'Postres', 12.00, 0, '', 4);
