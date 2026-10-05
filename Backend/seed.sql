-- ============================================================
-- DATOS SEMILLA - techfix_db (PostgreSQL)
-- TechFix Manager - re-ejecutable: vacía las tablas y carga
-- datos de prueba. Los usuarios usan contraseñas con hash BCrypt.
-- Contraseñas: admin123 / tecnico123 / recepcion123
-- ============================================================

BEGIN;

TRUNCATE TABLE
  orden_repuesto_detalles,
  orden_detalles,
  ordenes_servicio,
  equipos,
  usuarios,
  clientes,
  servicios,
  repuestos
RESTART IDENTITY CASCADE;

-- ------------------------------------------------------------
-- USUARIOS
-- ------------------------------------------------------------
INSERT INTO usuarios (id, nombre, email, password_hash, rol, activo) VALUES
(1, 'Admin TechFix', 'admin@techfix.com', '$2a$11$1uPLPS9YXijKEgcCWKi4MujppnoKTGIh/Y.fwxVeTUW4emio0dtUC', 'Admin', true),
(2, 'Carlos Gomez', 'tecnico@techfix.com', '$2a$11$uMaqvpUwfPKgOj.zFV/XZO4nMhWwG0g1KBI8z00vbpC3/nx7UMhfW', 'Tecnico', true),
(3, 'Maria Lopez', 'recepcion@techfix.com', '$2a$11$Jcs81lwhP8UVkAGFJPdfN.XlBAYOzdstW2RogLM8i93sUO8fhr2ta', 'Recepcion', true);

-- ------------------------------------------------------------
-- CLIENTES
-- ------------------------------------------------------------
INSERT INTO clientes (id, nombre, apellido, telefono, email, direccion, fecha_alta) VALUES
(1, 'Juan', 'Perez', '11-5555-1234', 'juan.perez@gmail.com', 'Av. Corrientes 1234, CABA', '2026-06-01'),
(2, 'Lucia', 'Gomez', '11-4444-2345', 'lucia.gomez@hotmail.com', 'Calle Falsa 567, Vicente Lopez', '2026-06-15'),
(3, 'Martin', 'Rodriguez', '11-3333-3456', 'martin.rodriguez@outlook.com', 'Av. Santa Fe 4567, CABA', '2026-07-02'),
(4, 'Ana', 'Fernandez', '11-2222-4567', 'ana.fernandez@gmail.com', 'Mendoza 890, San Isidro', '2026-07-20'),
(5, 'Pedro', 'Sanchez', '11-1111-5678', 'pedro.sanchez@gmail.com', 'Rivadavia 2345, CABA', '2026-08-10');

-- ------------------------------------------------------------
-- EQUIPOS
-- ------------------------------------------------------------
INSERT INTO equipos (id, cliente_id, tipo, marca, modelo, numero_serie, descripcion) VALUES
(1, 1, 'Smartphone', 'Samsung', 'Galaxy A54', 'R58M1234567', 'Pantalla rota tras caída'),
(2, 2, 'Notebook', 'Dell', 'Inspiron 15', 'DL99887766', 'No enciende'),
(3, 3, 'Smartphone', 'Apple', 'iPhone 11', 'F17X9876543', 'Batería agotada'),
(4, 4, 'Smartphone', 'Samsung', 'Galaxy S21', 'R58N5555111', 'No carga'),
(5, 3, 'Notebook', 'Lenovo', 'IdeaPad 3', 'LN22334455', 'Se calienta y se apaga'),
(6, 4, 'Tablet', 'Samsung', 'Tab A8', 'TB77889900', 'Sistema lento'),
(7, 5, 'Notebook', 'HP', 'Pavilion 14', 'HP44556677', 'No conecta WiFi');

-- ------------------------------------------------------------
-- SERVICIOS
-- ------------------------------------------------------------
INSERT INTO servicios (id, nombre, descripcion, precio, activo) VALUES
(1, 'Diagnóstico general', 'Revisión completa del equipo', 1500, true),
(2, 'Cambio de pantalla', 'Reemplazo de pantalla completa', 25000, true),
(3, 'Reemplazo de batería', 'Cambio de batería original o equivalente', 8000, true),
(4, 'Cambio de módulo de carga', 'Reemplazo del flex y conector de carga', 5500, true),
(5, 'Instalación de software', 'Formateo e instalación de sistema operativo', 3500, true),
(6, 'Recuperación de datos', 'Respaldo y recuperación de información', 12000, true),
(7, 'Limpieza interna', 'Limpieza de polvo y cambio de pasta térmica', 4000, true),
(8, 'Reparación de placa', 'Reparación de componentes de la placa madre', 18000, true),
(9, 'Cambio de teclado', 'Reemplazo de teclado integrado', 9500, true),
(10, 'Actualización de firmware', 'Actualización de software de sistema', 2500, false);

-- ------------------------------------------------------------
-- REPUESTOS
-- ------------------------------------------------------------
INSERT INTO repuestos (id, nombre, descripcion, precio, stock, activo) VALUES
(1, 'Pantalla LCD Galaxy A54', 'Pantalla original Samsung', 14000, 5, true),
(2, 'Batería iPhone 11', 'Batería de reemplazo certificada', 9500, 4, true),
(3, 'Cable de carga USB-C', 'Cable reforzado 1m', 1500, 25, true),
(4, 'Flex de carga Galaxy S21', 'Flex conector de carga', 3800, 8, true),
(5, 'Teclado notebook Dell', 'Teclado español', 7200, 3, true),
(6, 'Disco SSD 240GB', 'SSD SATA 240GB', 8900, 6, true),
(7, 'Memoria RAM 8GB DDR4', 'Módulo DDR4 3200MHz', 11000, 5, true),
(8, 'Placa madre Lenovo', 'Placa de repuesto', 45000, 1, true),
(9, 'Módulo WiFi HP', 'Tarjeta WiFi + Bluetooth', 6500, 2, true),
(10, 'Lector de tarjeta SD', 'Lector integrado', 2200, 10, true),
(11, 'Cooler notebook', 'Ventilador de repuesto', 3300, 7, true),
(12, 'Webcam HD USB', 'Cámara externa 1080p', 4800, 9, true);

-- ------------------------------------------------------------
-- ORDENES DE SERVICIO
-- ------------------------------------------------------------
INSERT INTO ordenes_servicio (id, numero_orden, equipo_id, usuario_id, fecha_ingreso, fecha_estimada,
  problema_reportado, diagnostico, solucion, estado, costo, observaciones, fecha_entrega) VALUES
(1, 'ORD-000001', 1, 2, '2026-08-20 10:00', '2026-08-23 17:00',
 'Pantalla rota tras caída', 'Pantalla LCD fracturada', 'Pantalla reemplazada',
 'Entregado', 39000, 'Garantía de 30 días sobre la reparación', '2026-08-23 16:30'),
(2, 'ORD-000002', 2, 1, '2026-08-22 09:30', '2026-08-25 17:00',
 'No enciende', 'Corto en la placa de alimentación', 'Placa reparada y memoria reemplazada',
 'Entregado', 29000, NULL, '2026-08-25 15:00'),
(3, 'ORD-000003', 3, 2, '2026-08-25 11:00', '2026-08-27 17:00',
 'Batería agotada', 'Batería con ciclo de vida agotado', 'Batería reemplazada',
 'Entregado', 17500, NULL, '2026-08-27 12:00'),
(4, 'ORD-000004', 4, 2, '2026-08-28 10:30', '2026-08-30 17:00',
 'Sin sonido', 'Daño en el amplificador de audio', 'Amplificador reparado',
 'Entregado', 18000, NULL, '2026-08-30 14:00'),
(5, 'ORD-000005', 5, 1, '2026-09-01 09:00', NULL,
 'Se calienta y se apaga', NULL, NULL,
 'Cancelado', 0, 'El cliente decidió no reparar', NULL),
(6, 'ORD-000006', 6, 3, '2026-09-03 12:00', '2026-09-05 17:00',
 'No lee tarjetas SD', 'Lector de tarjeta dañado', 'Lector de tarjeta reemplazado',
 'Entregado', 3700, NULL, '2026-09-05 16:00'),
(7, 'ORD-000007', 1, 3, '2026-09-15 09:15', NULL,
 'No reconoce la SIM', NULL, NULL,
 'Recibido', 0, 'Ingresado por recepción', NULL),
(8, 'ORD-000008', 2, 3, '2026-09-18 10:45', NULL,
 'Teclado no responde', NULL, NULL,
 'EnDiagnostico', 0, NULL, NULL),
(9, 'ORD-000009', 3, 2, '2026-09-19 11:30', NULL,
 'Cámara no funciona', 'Módulo de cámara con falla de enfoque', NULL,
 'EnDiagnostico', 0, NULL, NULL),
(10, 'ORD-000010', 4, 2, '2026-09-20 09:00', '2026-09-26 17:00',
 'No carga', 'Módulo de carga dañado', NULL,
 'Presupuestado', 9300, 'Presupuesto aprobado por el cliente', NULL),
(11, 'ORD-000011', 5, 1, '2026-09-21 14:00', '2026-09-27 17:00',
 'Se calienta y se apaga', 'Disipador obstruido y pasta térmica seca', NULL,
 'Presupuestado', 7300, NULL, NULL),
(12, 'ORD-000012', 6, 2, '2026-09-22 10:00', '2026-09-28 17:00',
 'Sistema lento', 'Disco con sectores dañados', NULL,
 'EnReparacion', 24400, 'Cambio de disco en curso', NULL),
(13, 'ORD-000013', 7, 2, '2026-09-23 15:00', '2026-09-26 17:00',
 'No conecta WiFi', 'Módulo WiFi defectuoso', 'Módulo WiFi reemplazado',
 'Listo', 24500, 'Avisar al cliente para la entrega', NULL);

-- ------------------------------------------------------------
-- DETALLES DE SERVICIO POR ORDEN
-- ------------------------------------------------------------
INSERT INTO orden_detalles (id, orden_id, servicio_id, cantidad, precio, subtotal) VALUES
(1, 1, 2, 1, 25000, 25000),
(2, 2, 8, 1, 18000, 18000),
(3, 3, 3, 1, 8000, 8000),
(4, 4, 8, 1, 18000, 18000),
(5, 6, 1, 1, 1500, 1500),
(6, 10, 4, 1, 5500, 5500),
(7, 11, 7, 1, 4000, 4000),
(8, 12, 6, 1, 12000, 12000),
(9, 12, 5, 1, 3500, 3500),
(10, 13, 8, 1, 18000, 18000);

-- ------------------------------------------------------------
-- REPUESTOS POR ORDEN
-- ------------------------------------------------------------
INSERT INTO orden_repuesto_detalles (id, orden_id, repuesto_id, cantidad, precio, subtotal) VALUES
(1, 1, 1, 1, 14000, 14000),
(2, 2, 7, 1, 11000, 11000),
(3, 3, 2, 1, 9500, 9500),
(4, 6, 10, 1, 2200, 2200),
(5, 10, 4, 1, 3800, 3800),
(6, 11, 11, 1, 3300, 3300),
(7, 12, 6, 1, 8900, 8900),
(8, 13, 9, 1, 6500, 6500);

-- ------------------------------------------------------------
-- AVANCE DE SECUENCIAS (para que los inserts de la API no
-- choquen con los ids sembrados)
-- ------------------------------------------------------------
SELECT setval(pg_get_serial_sequence('usuarios', 'id'), (SELECT MAX(id) FROM usuarios));
SELECT setval(pg_get_serial_sequence('clientes', 'id'), (SELECT MAX(id) FROM clientes));
SELECT setval(pg_get_serial_sequence('equipos', 'id'), (SELECT MAX(id) FROM equipos));
SELECT setval(pg_get_serial_sequence('ordenes_servicio', 'id'), (SELECT MAX(id) FROM ordenes_servicio));
SELECT setval(pg_get_serial_sequence('servicios', 'id'), (SELECT MAX(id) FROM servicios));
SELECT setval(pg_get_serial_sequence('repuestos', 'id'), (SELECT MAX(id) FROM repuestos));
SELECT setval(pg_get_serial_sequence('orden_detalles', 'id'), (SELECT MAX(id) FROM orden_detalles));
SELECT setval(pg_get_serial_sequence('orden_repuesto_detalles', 'id'), (SELECT MAX(id) FROM orden_repuesto_detalles));

COMMIT;
