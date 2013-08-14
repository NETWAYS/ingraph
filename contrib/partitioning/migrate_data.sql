--
-- usage:
--  import procedure into ingraph database
--
-- run:
--  mysql> CALL migrate_data(60, NOW() - INTERVAL 7 DAY, 25000);
--                           ^   ^--------------------^  ^---^
--                           |   |                       |-- copy X rows per transaction
--                           |   |-- DATETIME expression for the lower limit
--                           |       of data to copy
--                           |-- interval to migrate
--
DROP PROCEDURE IF EXISTS migrate_data;
DELIMITER //
CREATE PROCEDURE migrate_data(datainterval INTEGER, limittime DATETIME, limitrows INTEGER)
BEGIN
    SET @tablename   := (SELECT CONCAT('datapoint_',datainterval));
    SET @timeframeid := (SELECT id FROM timeframe WHERE `interval` = datainterval);
    SET @timelimit   := (SELECT UNIX_TIMESTAMP(limittime));

    SET @oldest_ts := NULL;
    SET @oldest_plot := NULL;
    SET @oldquery := CONCAT('SELECT `timestamp`, `plot_id` INTO @oldest_ts, @oldest_plot
        FROM ',@tablename,' ORDER BY `timestamp`, `plot_id` LIMIT 1');
    PREPARE oldestdata FROM @oldquery;

    SET @query := CONCAT('INSERT INTO ',@tablename,'
    SELECT `plot_id`, `timestamp`, `min`, `max`, `avg`,
           `lower_limit`, `upper_limit`, `warn_lower`, `warn_upper`, `warn_type`,
           `crit_lower`, `crit_upper`, `crit_type`, `count`
    FROM datapoint
    WHERE `timeframe_id` = ',@timeframeid,'
    AND (
        (`timestamp` = ? AND `plot_id` < ?)
        OR (timestamp < ?)
    ) AND `timestamp` >= ?
    ORDER BY `timestamp` DESC, `plot_id` DESC
    LIMIT ',limitrows);

    PREPARE stmt FROM @query;

    -- determine the last data we want to migrate (just for info)
    SET @oldestdata_to_migrate := (SELECT MIN(`timestamp`) FROM datapoint
                                   WHERE `timeframe_id` = @timeframeid
                                   AND `timestamp` >= @timelimit);

    REPEAT
        EXECUTE oldestdata; -- get @oldest_ts and @oldest_plot
        -- set timestamp and plot if we not already have migrated data
        SET @oldest_ts  := (SELECT COALESCE(@oldest_ts, UNIX_TIMESTAMP()));
        SET @oldest_plot  := (SELECT COALESCE(@oldest_plot, 0));

        -- select some info for printing in mysql shell
        SELECT FROM_UNIXTIME(@oldest_ts) AS `last_migrated_timestamp`,
               @oldest_plot AS `last_migrated_plot`,
               FROM_UNIXTIME(@timelimit) AS `time_limit`,
               FROM_UNIXTIME(@oldestdata_to_migrate) AS `oldestdata_to_migrate`;

        -- DEBUG: SELECT 'run stmt with:', @oldest_ts, @oldest_plot, @timelimit;
        EXECUTE stmt USING @oldest_ts, @oldest_plot, @oldest_ts, @timelimit;

        SELECT NOW() AS `logtime`, @found := FOUND_ROWS() as `copied_rows`;
    UNTIL @found = 0 END REPEAT;

    DEALLOCATE PREPARE oldestdata;
    DEALLOCATE PREPARE stmt;
END;
//
delimiter ;

-- vi: expandtab ts=4 sw=4 :
