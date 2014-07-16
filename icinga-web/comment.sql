CREATE TABLE `comment` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `host` varchar(255) NOT NULL,
  `service` varchar(255) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `author` varchar(127) NOT NULL,
  `text` text,
  PRIMARY KEY (`id`),
  KEY `host_service_time` (`host`, `service`, `time`)
);
