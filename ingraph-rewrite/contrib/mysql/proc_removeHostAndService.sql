DELIMITER $$

DROP PROCEDURE IF EXISTS `proc_removeHostAndService`$$
CREATE PROCEDURE `proc_removeHostAndService`(
    hostname VARCHAR(128),
    servicename VARCHAR(128)
)
BEGIN

DECLARE output TEXT DEFAULT '';
DECLARE affectedRows SMALLINT UNSIGNED DEFAULT 0;
DECLARE affectedRowsTotal BIGINT UNSIGNED DEFAULT 0;
DECLARE foundRows INT UNSIGNED DEFAULT 0;
DECLARE datapointTables CURSOR for
SELECT
    table_name
FROM
    INFORMATION_SCHEMA.TABLES
WHERE
    table_schema = DATABASE()
    AND table_name LIKE 'datapoint_%';

-- Uncomment following tow lines to rollback on any error
#DECLARE EXIT HANDLER FOR SQLEXCEPTION ROLLBACK;
#DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;

START TRANSACTION;

-- Delete from datapoints
SET @hostname = hostname;
SET @servicename = servicename;
OPEN datapointTables;
SET foundRows = FOUND_ROWS();
datapointLoop: LOOP
    IF foundRows > 0 THEN BEGIN
        DECLARE tablename VARCHAR(64);
        FETCH datapointTables INTO tablename;
        SET foundRows = foundRows - 1;
        SET @del1 = CONCAT(
            'DELETE FROM ',
                tablename,
            ' WHERE '
                'plot_id IN ('
                    'SELECT '
                        'p.id '
                    'FROM '
                        'plot p '
                    'INNER JOIN '
                        'hostservice hs ON p.hostservice_id = hs.id '
                    'INNER JOIN '
                        'hostservice parent ON parent.id = hs.parent_hostservice_id '
                    'INNER JOIN '
                        'host h on parent.host_id = h.id '
                    'INNER JOIN '
                        'service s on parent.service_id = s.id '
                    'WHERE '
                        'h.name LIKE ? ',
                        'AND s.name LIKE ? ',
                    'ORDER BY '
                        'p.id'
                ') '
            'LIMIT 1000');
        PREPARE del1Stmt FROM @del1;
        SET @del2 = CONCAT(
            'DELETE FROM ',
                tablename,
            ' WHERE '
                'plot_id IN ('
                    'SELECT '
                        'p.id '
                    'FROM '
                        'plot p '
                    'INNER JOIN '
                        'hostservice hs ON p.hostservice_id = hs.id '
                    'INNER JOIN '
                        'host h on hs.host_id = h.id '
                    'INNER JOIN '
                        'service s on hs.service_id = s.id '
                    'WHERE '
                        'h.name LIKE ? ',
                        'AND s.name LIKE ? ',
                    'ORDER BY '
                        'p.id'
                ') '
            'LIMIT 1000');
        PREPARE del2Stmt FROM @del2;
        REPEAT
            EXECUTE del1Stmt USING @hostname, @servicename;
            SET affectedRows = ROW_COUNT();
            SET affectedRowsTotal = affectedRowsTotal + affectedRows;
        UNTIL affectedRows = 0 END REPEAT;
        REPEAT
            EXECUTE del2Stmt USING @hostname, @servicename;
            SET affectedRows = ROW_COUNT();
            SET affectedRowsTotal = affectedRowsTotal + affectedRows;
        UNTIL affectedRows = 0 END REPEAT;
    END; ELSE
        LEAVE datapointLoop;
    END IF;
END LOOP datapointLoop;
CLOSE datapointTables;
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
