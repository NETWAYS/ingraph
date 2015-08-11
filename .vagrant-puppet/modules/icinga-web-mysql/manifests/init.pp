# Class: icinga-web-mysql
#
#   This class installs Icinga-web using a MySQL database.
#
# Parameters:
#
# Actions:
#
# Requires:
#
#   icinga-packages, mysql, php
#
# Sample Usage:
#
#   include icinga-web
#
class icinga-web-mysql {
  require icinga-packages
  require mysql
  require php

  php::extension { [ 'php-mysql' ]: }

  package { 'icinga-web':
    ensure  => installed,
    notify  => Service['apache']
  }

  exec { 'create-mysql-icinga-web-db':
    path    => '/bin:/usr/bin',
    unless  => 'mysql -uicinga_web -picinga_web icinga_web',
    command => 'mysql -uroot -e "CREATE DATABASE icinga_web; \
                GRANT ALL ON icinga_web.* TO icinga_web@localhost IDENTIFIED BY \'icinga_web\';"',
    require => Service['mysqld']
  }

  exec { 'populate-icinga-web-mysql-db':
    path    => '/bin:/usr/bin',
    unless  => 'mysql -uicinga_web -picinga_web icinga_web -e "SELECT * FROM nsm_user;" &> /dev/null',
    command => 'mysql -uicinga_web -picinga_web icinga_web < /usr/share/icinga-web/etc/schema/mysql.sql',
    require => [ Exec['create-mysql-icinga-web-db'], Package['icinga-web'] ]
  }
}
