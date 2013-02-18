-- MySQL dump 10.13  Distrib 5.1.49, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: ingraph
-- ------------------------------------------------------
-- Server version	5.1.49-3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `comment`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `comment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hostservice_id` int(11) NOT NULL,
  `timestamp` int(11) NOT NULL,
  `comment_timestamp` int(11) NOT NULL,
  `author` varchar(128) NOT NULL,
  `text` varchar(512) NOT NULL,
  PRIMARY KEY (`id`,`hostservice_id`,`timestamp`),
  KEY `hostservice_id` (`hostservice_id`),
  CONSTRAINT `comment_ibfk_1` FOREIGN KEY (`hostservice_id`) REFERENCES `hostservice` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `host`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `host` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hostservice`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hostservice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `host_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `parent_hostservice_id` int(11) DEFAULT NULL,
  `check_command` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_hs_1` (`host_id`,`service_id`,`parent_hostservice_id`),
  KEY `parent_hostservice_id` (`parent_hostservice_id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `hostservice_ibfk_1` FOREIGN KEY (`host_id`) REFERENCES `host` (`id`),
  CONSTRAINT `hostservice_ibfk_2` FOREIGN KEY (`parent_hostservice_id`) REFERENCES `hostservice` (`id`),
  CONSTRAINT `hostservice_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `service` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plot`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `plot` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hostservice_id` int(11) NOT NULL,
  `name` varchar(128) NOT NULL,
  `unit` varchar(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_plot_1` (`hostservice_id`,`name`),
  CONSTRAINT `plot_ibfk_1` FOREIGN KEY (`hostservice_id`) REFERENCES `hostservice` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pluginstatus`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pluginstatus` (
  `hostservice_id` int(11) NOT NULL,
  `timestamp` int(11) NOT NULL,
  `status` TINYINT(1) NOT NULL,
  PRIMARY KEY (`hostservice_id`,`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

create table `performance_data`(
  `plot_id` int(11) NOT NULL,
  `timestamp` int(11) NOT NULL,
  `lower_limit` decimal(20,5) DEFAULT NULL,
  `upper_limit` decimal(20,5) DEFAULT NULL,
  `warn_lower` decimal(20,5) DEFAULT NULL,
  `warn_upper` decimal(20,5) DEFAULT NULL,
  `warn_type` enum('inside','outside') DEFAULT NULL,
  `crit_lower` decimal(20,5) DEFAULT NULL,
  `crit_upper` decimal(20,5) DEFAULT NULL,
  `crit_type` enum('inside','outside') DEFAULT NULL,
  PRIMARY KEY (`plot_id`, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
--
-- Table structure for table `service`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2013-01-07 15:35:33
