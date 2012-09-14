DELIMITER $$

DROP PROCEDURE IF EXISTS `proc_removeHostAndService`$$
CREATE PROCEDURE `proc_removeHostAndService`(
    hostname varchar(128),
    servicename varchar(128)
)
BEGIN

DECLARE output TEXT DEFAULT '';

/*
 * Rollback on any error
 */ 
DECLARE EXIT HANDLER FOR SQLEXCEPTION ROLLBACK;
DECLARE EXIT HANDLER FOR SQLWARNING ROLLBACK;

START TRANSACTION;

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
    );

SET output = CONCAT("Removed ", ROW_COUNT(), " datapoints");


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

SET output = CONCAT(output, " and ", ROW_COUNT(), " plots");


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

SET output = CONCAT(output, " and ", ROW_COUNT(), " pluginstatus");


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

SET output = CONCAT(output, " and ", ROW_COUNT(), " host service combinations");

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

SET output = CONCAT(output, " and ", ROW_COUNT(), " services");


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
