DELIMITER $$

DROP PROCEDURE IF EXISTS `proc_removeHostAndService`$$
CREATE PROCEDURE `proc_removeHostAndService`(
    hostname varchar(128),
    servicename varchar(128)
)
BEGIN

DECLARE output TEXT DEFAULT '';
DECLARE rowCount INT UNSIGNED DEFAULT 0;
DECLARE affectedRows INT UNSIGNED DEFAULT 50000;

/*
 * Uncomment following tow lines to rollback on any error
 */ 
#DECLARE EXIT HANDLER FOR SQLEXCEPTION ROLLBACK;
#DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;

START TRANSACTION;

/*
 * Delete from datapoints
 */
WHILE affectedRows >= 50000 DO
    DELETE FROM
        datapoint
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
        )
    LIMIT
        50000;
    SET affectedRows = ROW_COUNT();
    SET rowCount = rowCount + affectedRows;
END WHILE;
SET affectedRows = 50000;
WHILE affectedRows >= 50000  DO
    DELETE FROM
        datapoint
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
        )
    LIMIT
        50000;
    SET affectedRows = ROW_COUNT();
    SET rowCount = rowCount + affectedRows;
END WHILE;
SET output = CONCAT("Removed ", rowCount, " datapoints");

/*
 * Delete from plots
 */
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

SET rowCount = ROW_COUNT();

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

SET rowCount = rowCount + ROW_COUNT();
SET output = CONCAT(output, ", ", rowCount, " plots");

/*
 * Delete from pluginstatus
 */
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

SET rowCount = ROW_COUNT();

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

SET rowCount = rowCount + ROW_COUNT();
SET output = CONCAT(output, ", ", rowCount, " pluginstatus");

/*
 * Delete from hostservice
 */
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

SET rowCount = ROW_COUNT();

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

SET rowCount = rowCount + ROW_COUNT();
SET output = CONCAT(output, ", ", rowCount, " host service combinations");

/*
 * Delete from service
 */
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

/*
 * Delete from host
 */
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
