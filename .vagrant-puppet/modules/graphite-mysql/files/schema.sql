-- MySQL dump 10.13  Distrib 5.1.73, for redhat-linux-gnu (x86_64)
--
-- Host: localhost    Database: graphite
-- ------------------------------------------------------
-- Server version	5.1.73

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
-- Table structure for table `account_profile`
--

DROP TABLE IF EXISTS `account_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `account_profile` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `history` longtext NOT NULL,
  `advancedUI` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_profile`
--

LOCK TABLES `account_profile` WRITE;
/*!40000 ALTER TABLE `account_profile` DISABLE KEYS */;
INSERT INTO `account_profile` VALUES (1,2,'',0);
/*!40000 ALTER TABLE `account_profile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `content_type_id` int(11) NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_type_id` (`content_type_id`,`codename`),
  KEY `auth_permission_e4470c6e` (`content_type_id`)
) ENGINE=MyISAM AUTO_INCREMENT=49 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add profile',1,'add_profile'),(2,'Can change profile',1,'change_profile'),(3,'Can delete profile',1,'delete_profile'),(4,'Can add variable',2,'add_variable'),(5,'Can change variable',2,'change_variable'),(6,'Can delete variable',2,'delete_variable'),(7,'Can add view',3,'add_view'),(8,'Can change view',3,'change_view'),(9,'Can delete view',3,'delete_view'),(10,'Can add window',4,'add_window'),(11,'Can change window',4,'change_window'),(12,'Can delete window',4,'delete_window'),(13,'Can add my graph',5,'add_mygraph'),(14,'Can change my graph',5,'change_mygraph'),(15,'Can delete my graph',5,'delete_mygraph'),(16,'Can add dashboard',6,'add_dashboard'),(17,'Can change dashboard',6,'change_dashboard'),(18,'Can delete dashboard',6,'delete_dashboard'),(19,'Can add event',7,'add_event'),(20,'Can change event',7,'change_event'),(21,'Can delete event',7,'delete_event'),(22,'Can add permission',8,'add_permission'),(23,'Can change permission',8,'change_permission'),(24,'Can delete permission',8,'delete_permission'),(25,'Can add group',9,'add_group'),(26,'Can change group',9,'change_group'),(27,'Can delete group',9,'delete_group'),(28,'Can add user',10,'add_user'),(29,'Can change user',10,'change_user'),(30,'Can delete user',10,'delete_user'),(31,'Can add message',11,'add_message'),(32,'Can change message',11,'change_message'),(33,'Can delete message',11,'delete_message'),(34,'Can add session',12,'add_session'),(35,'Can change session',12,'change_session'),(36,'Can delete session',12,'delete_session'),(37,'Can add log entry',13,'add_logentry'),(38,'Can change log entry',13,'change_logentry'),(39,'Can delete log entry',13,'delete_logentry'),(40,'Can add content type',14,'add_contenttype'),(41,'Can change content type',14,'change_contenttype'),(42,'Can delete content type',14,'delete_contenttype'),(43,'Can add tag',15,'add_tag'),(44,'Can change tag',15,'change_tag'),(45,'Can delete tag',15,'delete_tag'),(46,'Can add tagged item',16,'add_taggeditem'),(47,'Can change tagged item',16,'change_taggeditem'),(48,'Can delete tagged item',16,'delete_taggeditem');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(30) NOT NULL,
  `first_name` varchar(30) NOT NULL,
  `last_name` varchar(30) NOT NULL,
  `email` varchar(75) NOT NULL,
  `password` varchar(128) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `last_login` datetime NOT NULL,
  `date_joined` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user`
--

LOCK TABLES `auth_user` WRITE;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
INSERT INTO `auth_user` VALUES (1,'root','','','root@localhost.local','sha1$024b5$7aa31ac26eb27383c63e71d76dbf634baa71370f',1,1,1,'2014-04-25 09:38:37','2014-04-25 09:38:37'),(2,'default','','','default@localhost.localdomain','sha1$e7348$c3daff104e74e4c579e86439c6d9ef7becacd7c4',0,1,0,'2014-04-25 09:38:37','2014-04-25 09:38:37');
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_content_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `app_label` (`app_label`,`model`)
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'profile','account','profile'),(2,'variable','account','variable'),(3,'view','account','view'),(4,'window','account','window'),(5,'my graph','account','mygraph'),(6,'dashboard','dashboard','dashboard'),(7,'event','events','event'),(8,'permission','auth','permission'),(9,'group','auth','group'),(10,'user','auth','user'),(11,'message','auth','message'),(12,'session','sessions','session'),(13,'log entry','admin','logentry'),(14,'content type','contenttypes','contenttype'),(15,'tag','tagging','tag'),(16,'tagged item','tagging','taggeditem');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2014-04-25 09:38:40
