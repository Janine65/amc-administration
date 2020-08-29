---
-- Table structure for table `adressen`
--

DROP TABLE IF EXISTS `adressen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adressen` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `mnr` int(11) NOT NULL,
  `geschlecht` int(11) NOT NULL DEFAULT '1',
  `name` varchar(255) NOT NULL,
  `vorname` varchar(255) NOT NULL,
  `adresse` varchar(255) NOT NULL,
  `plz` int(8) NOT NULL,
  `ort` varchar(255) NOT NULL,
  `land` varchar(45) NOT NULL DEFAULT 'CH',
  `telefon_p` varchar(50) DEFAULT NULL,
  `telefon_g` varchar(50) DEFAULT NULL,
  `mobile` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `eintritt` date DEFAULT NULL,
  `sam_mitglied` tinyint(1) NOT NULL DEFAULT '0',
  `jahresbeitrag` decimal(19,4) DEFAULT NULL,
  `mnr_sam` int(10) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `vorstand` tinyint(1) NOT NULL DEFAULT '0',
  `ehrenmitglied` tinyint(1) NOT NULL DEFAULT '0',
  `veteran1` tinyint(1) NOT NULL DEFAULT '0',
  `veteran2` tinyint(1) NOT NULL DEFAULT '0',
  `revisor` int(10) DEFAULT NULL,
  `motojournal` tinyint(1) NOT NULL DEFAULT '0',
  `austritt` date DEFAULT '3000-01-01',
  `austritt_mail` tinyint(1) NOT NULL DEFAULT '0',
  `adressenId` int(10) DEFAULT NULL,
  `jahrgang` int(10) DEFAULT NULL,
  `brumm_email` tinyint(1) NOT NULL DEFAULT '0',
  `arbeitgeber` varchar(50) DEFAULT NULL,
  `pensioniert` tinyint(1) NOT NULL DEFAULT '0',
  `allianz` tinyint(1) NOT NULL DEFAULT '0',
  `notes` longtext ,
  `fullname` varchar(500) GENERATED ALWAYS AS (concat_ws(`vorname`,`name`)) VIRTUAL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mnr_UNIQUE` (`mnr`),
  KEY `ADRESSE` (`adresse`),
  KEY `AnredeAdressen` (`geschlecht`),
  KEY `NAME` (`name`),
  KEY `PLZ` (`plz`)
) ENGINE=MyISAM AUTO_INCREMENT=1 ;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `adressen_aktuell`
--

DROP TABLE IF EXISTS `adressen_aktuell`;
/*!50001 DROP VIEW IF EXISTS `adressen_aktuell`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `adressen_aktuell` AS SELECT 
 1 AS `Anrede`,
 1 AS `Name`,
 1 AS `Vorname`,
 1 AS `Adresse`,
 1 AS `PLZ`,
 1 AS `Ort`,
 1 AS `SAM`,
 1 AS `Eintritt`,
 1 AS `Email`,
 1 AS `Austritt`,
 1 AS `Clubjahre`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `anlaesse`
--

DROP TABLE IF EXISTS `anlaesse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `anlaesse` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `Datum` datetime NOT NULL,
  `Name` varchar(50) NOT NULL,
  `Beschreibung` varchar(100) DEFAULT NULL,
  `Punkte` smallint(5) DEFAULT NULL,
  `IstKegeln` tinyint(1) NOT NULL DEFAULT '0',
  `istsamanlass` tinyint(1) NOT NULL DEFAULT '0',
  `Nachkegeln` tinyint(4) NOT NULL DEFAULT '0',
  `gaeste` smallint(5) DEFAULT '0',
  `anlaesseId` int(10) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `longname` varchar(500) GENERATED ALWAYS AS (concat_ws(,date_format(`Datum`,'%d.%m.%Y'),`Name`)) VIRTUAL,
  PRIMARY KEY (`id`),
  KEY `Datum` (`Datum`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `austritte_clubjahr`
--

DROP TABLE IF EXISTS `austritte_clubjahr`;
/*!50001 DROP VIEW IF EXISTS `austritte_clubjahr`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `austritte_clubjahr` AS SELECT 
 1 AS `Anrede`,
 1 AS `Name`,
 1 AS `Vorname`,
 1 AS `Adresse`,
 1 AS `PLZ`,
 1 AS `Ort`,
 1 AS `SAM`,
 1 AS `Eintritt`,
 1 AS `Austritt`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `clubmeister`
--

DROP TABLE IF EXISTS `clubmeister`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clubmeister` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `Jahr` varchar(4) NOT NULL,
  `rang` smallint(5) DEFAULT NULL,
  `Vorname` varchar(255) DEFAULT NULL,
  `Nachname` varchar(255) DEFAULT NULL,
  `mitgliedId` smallint(5) DEFAULT NULL,
  `Punkte` smallint(5) DEFAULT NULL,
  `Anlaesse` smallint(5) DEFAULT NULL,
  `Werbungen` smallint(5) DEFAULT NULL,
  `Mitglieddauer` smallint(5) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `indexUnique` (`Jahr`,`rang`),
  KEY `MNR` (`mitgliedId`)
) ENGINE=MyISAM AUTO_INCREMENT=1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `eintritte_clubjahr`
--

DROP TABLE IF EXISTS `eintritte_clubjahr`;
/*!50001 DROP VIEW IF EXISTS `eintritte_clubjahr`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `eintritte_clubjahr` AS SELECT 
 1 AS `Anrede`,
 1 AS `Name`,
 1 AS `Vorname`,
 1 AS `Adresse`,
 1 AS `PLZ`,
 1 AS `Ort`,
 1 AS `SAM`,
 1 AS `Eintritt`,
 1 AS `Geworben von`,
 1 AS `Austritt`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `kegelmeister`
--

DROP TABLE IF EXISTS `kegelmeister`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kegelmeister` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `Jahr` varchar(4) NOT NULL,
  `rang` smallint(5) DEFAULT NULL,
  `Vorname` varchar(255) DEFAULT NULL,
  `Nachname` varchar(255) DEFAULT NULL,
  `mitgliedId` smallint(5) DEFAULT NULL,
  `Punkte` smallint(5) DEFAULT NULL,
  `Anlaesse` smallint(5) DEFAULT NULL,
  `Babeli` smallint(5) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meisterschaft`
--

DROP TABLE IF EXISTS `meisterschaft`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meisterschaft` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `mitgliedId` int(10) NOT NULL DEFAULT '0',
  `eventId` int(10) NOT NULL DEFAULT '0',
  `punkte` smallint(5) DEFAULT NULL,
  `Wurf1` smallint(5) DEFAULT NULL,
  `Wurf2` smallint(5) DEFAULT NULL,
  `Wurf3` smallint(5) DEFAULT NULL,
  `Wurf4` smallint(5) DEFAULT NULL,
  `Wurf5` smallint(5) DEFAULT NULL,
  `zusatz` int(1) DEFAULT '5',
  `Streichresultat` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '	',
  PRIMARY KEY (`id`),
  UNIQUE KEY `eventmitglied` (`mitgliedId`,`eventId`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `parameter`
--

DROP TABLE IF EXISTS `parameter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parameter` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(45) NOT NULL,
  `value` varchar(45) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sid` varchar(45) NOT NULL,
  `userId` varchar(45) DEFAULT NULL,
  `expires` datetime DEFAULT NULL,
  `data` mediumtext,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `sid_UNIQUE` (`sid`)
) ENGINE=InnoDB AUTO_INCREMENT=1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `adressen_aktuell`
--

/*!50001 DROP VIEW IF EXISTS `adressen_aktuell`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`192.168.1.%` SQL SECURITY DEFINER */
/*!50001 VIEW `adressen_aktuell` AS select elt((`adr`.`geschlecht` = '1'),'Herr','Frau') AS `Anrede`,`adr`.`name` AS `Name`,`adr`.`vorname` AS `Vorname`,`adr`.`adresse` AS `Adresse`,`adr`.`plz` AS `PLZ`,`adr`.`ort` AS `Ort`,elt((`adr`.`sam_mitglied` + 1),'Nein','Ja') AS `SAM`,cast(`adr`.`eintritt` as date) AS `Eintritt`,`adr`.`email` AS `Email`,cast(`adr`.`austritt` as date) AS `Austritt`,((select `parameter`.`value` from `parameter` where (`parameter`.`key` = 'CLUBJAHR')) - year(`adr`.`eintritt`)) AS `Clubjahre` from `adressen` `adr` where ((year(`adr`.`austritt`) >= (select `parameter`.`value` from `parameter` where (`parameter`.`key` = 'CLUBJAHR'))) or (`adr`.`austritt` is null)) order by `adr`.`name`,`adr`.`vorname` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `austritte_clubjahr`
--

/*!50001 DROP VIEW IF EXISTS `austritte_clubjahr`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`192.168.1.%` SQL SECURITY DEFINER */
/*!50001 VIEW `austritte_clubjahr` AS select elt((`adr`.`geschlecht` = '1'),'Herr','Frau') AS `Anrede`,`adr`.`name` AS `Name`,`adr`.`vorname` AS `Vorname`,`adr`.`adresse` AS `Adresse`,`adr`.`plz` AS `PLZ`,`adr`.`ort` AS `Ort`,elt((`adr`.`sam_mitglied` + 1),'Nein','Ja') AS `SAM`,cast(`adr`.`eintritt` as date) AS `Eintritt`,cast(`adr`.`austritt` as date) AS `Austritt` from `adressen` `adr` where (year(`adr`.`austritt`) = (select `parameter`.`value` from `parameter` where (`parameter`.`key` = 'CLUBJAHR'))) order by `adr`.`name`,`adr`.`vorname` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `eintritte_clubjahr`
--

/*!50001 DROP VIEW IF EXISTS `eintritte_clubjahr`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`192.168.1.%` SQL SECURITY DEFINER */
/*!50001 VIEW `eintritte_clubjahr` AS select elt((`adr`.`geschlecht` = '1'),'Herr','Frau') AS `Anrede`,`adr`.`name` AS `Name`,`adr`.`vorname` AS `Vorname`,`adr`.`adresse` AS `Adresse`,`adr`.`plz` AS `PLZ`,`adr`.`ort` AS `Ort`,elt((`adr`.`sam_mitglied` + 1),'Nein','Ja') AS `SAM`,cast(`adr`.`eintritt` as date) AS `Eintritt`,`adr`.`adressenId` AS `Geworben von`,cast(`adr`.`austritt` as date) AS `Austritt` from `adressen` `adr` where ((year(`adr`.`eintritt`) = (select `parameter`.`value` from `parameter` where (`parameter`.`key` = 'CLUBJAHR'))) and (`adr`.`austritt` is null)) order by `adr`.`name`,`adr`.`vorname` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-08-29 14:26:47
