# Class: php
#
#   This class installs PHP.
#
# Parameters:
#
# Actions:
#
# Requires:
#
#   apache
#
# Sample Usage:
#
#   include php
#
class php {
  include apache

  package { 'php':
    ensure  => installed,
    notify  => Service['apache']
  }

  file { '/etc/php.d/error_reporting.ini':
    content => template('php/error_reporting.ini.erb'),
    require => Package['php'],
    notify  => Service['apache']
  }
}
