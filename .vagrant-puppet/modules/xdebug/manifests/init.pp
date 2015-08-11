# Class: xdebug
#
#   This class installs the Xdebug PHP extension.
#
# Parameters:
#
# Actions:
#
# Requires:
#
#   php
#   epel if $::operatingsystem =~ /(RedHat|CentOS|Fedora)/
#
# Sample Usage:
#
#   include xdebug
#
class xdebug {
  require php

  $xdebug = $::operatingsystem ? {
    /(Debian|Ubuntu)/           => 'php5-xdebug',
    /(RedHat|CentOS|Fedora)/    => 'php-pecl-xdebug'
  }

  $phpd = $::operatingsystem ? {
    /(Debian|Ubuntu)/           => '/etc/php5/conf.d/',
    /(RedHat|CentOS|Fedora)/    => '/etc/php.d/'
  }

  package { $xdebug:
    ensure  => installed,
    alias   => 'xdebug'
  }

  if $::operatingsystem =~ /(RedHat|CentOS|Fedora)/ {
    include epel
    Package[$xdebug] {
      require +> Class['epel']
    }
  }

  file { "${phpd}/xdebug_settings.ini":
    content => template('xdebug/xdebug_settings.ini.erb'),
    require => Package['xdebug'],
    notify  => Service['apache']
  }
}
