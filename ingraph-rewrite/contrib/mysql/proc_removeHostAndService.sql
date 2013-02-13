DELIMITER $$

DROP PROCEDURE IF EXISTS `proc_removeHostAndService`$$
CREATE PROCEDURE `proc_removeHostAndService`(
    hostname VARCHAR(128),
    servicename VARCHAR(128)
)
BEGIN

DECLARE output TEXT DEFAULT '';
DECLARE affectedRowsTotal BIGINT UNSIGNED DEFAULT 0;
DECLARE tablename VARCHAR(64);
DECLARE plotId INT;
DECLARE END_LOOP TINYINT DEFAULT 0;
DECLARE datapointTables CURSOR FOR
    SELECT
        table_name
    FROM
        INFORMATION_SCHEMA.TABLES
    WHERE
        table_schema = DATABASE()
        AND table_name LIKE 'datapoint_%';
DECLARE plotIds CURSOR FOR
    SELECT
        p.id AS id
    FROM
        plot p
    INNER JOIN
        hostservice hs ON p.hostservice_id = hs.id
    INNER JOIN
        hostservice parent ON parent.id = hs.parent_hostservice_id
    INNER JOIN
        host h on parent.host_id = h.id
    INNER JOIN
        service s on parent.service_id = s.id
    WHERE
        h.name LIKE hostname
        AND s.name LIKE servicename
    UNION SELECT
        p.id AS id
    FROM
        plot p
    INNER JOIN
        hostservice hs ON p.hostservice_id = hs.id
    INNER JOIN
        host h on hs.host_id = h.id
    INNER JOIN
        service s on hs.service_id = s.id
    WHERE
        h.name LIKE hostname
        AND s.name LIKE servicename
    ORDER BY
        id;
DECLARE CONTINUE HANDLER FOR 1329 set END_LOOP = 1;

-- Uncomment following tow lines to rollback on any error
#DECLARE EXIT HANDLER FOR SQLEXCEPTION ROLLBACK;
#DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;

START TRANSACTION;

-- Delete from datapoints
OPEN datapointTables;
datapointLoop: LOOP
    FETCH datapointTables INTO tablename;
    IF END_LOOP THEN
        CLOSE datapointTables;
        LEAVE datapointLoop;
    END IF;
    SET @del = CONCAT(
        'DELETE FROM ',
            tablename,
        ' WHERE '
            'plot_id = ?');
    PREPARE del FROM @del;
    OPEN plotIds;
    plotLoop: LOOP
        FETCH plotIds INTO plotId;
        IF END_LOOP THEN
            SET END_LOOP = 0;
            CLOSE plotIds;
            LEAVE plotLoop;x
        END IF;
        SET @plotId = plotId;
        EXECUTE del USING @plotId;
        SET affectedRowsTotal = affectedRowsTotal + ROW_COUNT();
    END LOOP plotLoop;
END LOOP datapointLoop;
SET output = CONCAT("Removed ", affectedRowsTotal, " datapoints");

-- Delete from performance data
DELETE FROM
    performance_data
WHERE
    plot_id IN (
        SELECT
            p.id
        FROM
            plot p
        INNER JOIN
            hostservice hs ON p.hostservice_id = hs.id
        INNER JOIN
            hostservice parent ON parent.id = hs.parent_hostservice_id
        INNER JOIN
            host h on parent.host_id = h.id
        INNER JOIN
            service s on parent.service_id = s.id
        WHERE
            h.name LIKE hostname
            AND s.name LIKE servicename
        ORDER BY
            p.id
    );
SET affectedRowsTotal = ROW_COUNT();
DELETE FROM
    performance_data
WHERE
    plot_id IN (
        SELECT
            p.id
        FROM
            plot p
        INNER JOIN
            hostservice hs ON p.hostservice_id = hs.id
        INNER JOIN
            host h on hs.host_id = h.id
        INNER JOIN
            service s on hs.service_id = s.id
        WHERE
            h.name LIKE hostname
            AND s.name LIKE servicename
        ORDER BY
            p.id
    );
SET affectedRowsTotal = affectedRowsTotal + ROW_COUNT();
SET output = CONCAT(output, ", ", affectedRowsTotal, " rows from performance data");

-- Delete from plots
DELETE
    p
FROM
    plot p
INNER JOIN
    hostservice hs ON p.hostservice_id = hs.id
INNER JOIN
    hostservice parent ON parent.id = hs.parent_hostservice_id
INNER JOIN
    host h on parent.host_id = h.id
INNER JOIN
    service s on parent.service_id = s.id
WHERE
    h.name LIKE hostname
    AND s.name LIKE servicename;
SET affectedRowsTotal = ROW_COUNT();
DELETE
    p
FROM
    plot p
INNER JOIN
    hostservice hs ON p.hostservice_id = hs.id
INNER JOIN
    host h on hs.host_id = h.id
INNER JOIN
    service s on hs.service_id = s.id
WHERE
    h.name LIKE hostname
    AND s.name LIKE servicename;
SET affectedRowsTotal = affectedRowsTotal + ROW_COUNT();
SET output = CONCAT(output, ", ", affectedRowsTotal, " plots");

-- Delete from pluginstatus
DELETE
    ps
FROM
    pluginstatus ps
INNER JOIN
    hostservice hs on ps.hostservice_id = hs.id
INNER JOIN
    hostservice parent ON parent.id = hs.parent_hostservice_id
INNER JOIN
    host h on parent.host_id = h.id
INNER JOIN
    service s on parent.service_id = s.id
WHERE
    h.name LIKE hostname
    AND s.name LIKE servicename;
SET affectedRowsTotal = ROW_COUNT();
DELETE
    ps
FROM
    pluginstatus ps
INNER JOIN
    hostservice hs on ps.hostservice_id = hs.id
INNER JOIN
    host h on hs.host_id = h.id
INNER JOIN
    service s on hs.service_id = s.id
WHERE
    h.name LIKE hostname
    AND s.name LIKE servicename;
SET affectedRowsTotal = affectedRowsTotal + ROW_COUNT();
SET output = CONCAT(output, ", ", affectedRowsTotal, " rows from pluginstatus");

-- Delete from hostservice
DELETE
    hs
FROM
    hostservice hs
INNER JOIN
    hostservice parent ON parent.id = hs.parent_hostservice_id
INNER JOIN
    host h on parent.host_id = h.id
INNER JOIN
    service s on parent.service_id = s.id
WHERE
    h.name LIKE hostname
    AND s.name LIKE servicename;
SET affectedRowsTotal = ROW_COUNT();
DELETE
    hs
FROM
    hostservice hs
INNER JOIN
    host h on hs.host_id = h.id
INNER JOIN
    service s on hs.service_id = s.id
WHERE
    h.name LIKE hostname
    AND s.name LIKE servicename;
SET affectedRowsTotal = affectedRowsTotal + ROW_COUNT();
SET output = CONCAT(output, ", ", affectedRowsTotal, " host service combinations");

-- Delete from service
DELETE FROM
    service
WHERE
    name LIKE servicename
    AND id NOT IN (
        SELECT
            service_id
        FROM
            hostservice
    );
SET output = CONCAT(output, ", ", ROW_COUNT(), " services");

-- Delete from host
DELETE FROM
    host
WHERE
    name LIKE hostname
    AND id NOT IN (
        SELECT
            host_id
        FROM
            hostservice
    );
SET output = CONCAT(output, " and ", ROW_COUNT(), " hosts.");

SELECT output AS Summary;

COMMIT;

END$$

DELIMITER ;
