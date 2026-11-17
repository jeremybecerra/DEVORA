
-- DEVORA - Verificación de persistencia MySQL
-- Responsable: Adriana Montenegro
-- Consultas de solo lectura

USE devora;

-- PRUEBA 1: Verificar registros
SELECT
    (SELECT COUNT(*) FROM mesas) AS mesas,
    (SELECT COUNT(*) FROM productos) AS productos,
    (SELECT COUNT(*) FROM comensales) AS comensales,
    (SELECT COUNT(*) FROM pedidos) AS pedidos,
    (SELECT COUNT(*) FROM detalles_pedido) AS detalles;

-- PRUEBA 2: Verificar pedidos y comensales
SELECT
    p.id AS pedido,
    m.nombre AS mesa,
    c.nombre AS comensal,
    p.estado,
    p.total
FROM pedidos p
JOIN mesas m ON p.mesa_id = m.id
JOIN comensales c ON p.comensal_id = c.id
ORDER BY p.id DESC;

-- PRUEBA 3: Verificar productos por pedido
SELECT
    dp.pedido_id,
    dp.nombre_producto,
    dp.cantidad,
    dp.precio_unitario,
    dp.subtotal
FROM detalles_pedido dp
ORDER BY dp.pedido_id, dp.id;

-- PRUEBA 4: Detectar diferencias en los totales
SELECT
    p.id AS pedido,
    p.total AS total_registrado,
    COALESCE(SUM(dp.subtotal), 0) AS total_calculado
FROM pedidos p
LEFT JOIN detalles_pedido dp
    ON dp.pedido_id = p.id
GROUP BY p.id, p.total
HAVING ABS(
    total_registrado - total_calculado
) > 0.001;
