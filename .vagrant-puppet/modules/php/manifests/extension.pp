# define: php::extension
#
#   Install additional PHP modules.
#
# Parameters:
#
# Actions:
#
# Requires:
#
#   php
#
# Sample Usage:
#
#   php::extension { 'php-ldap': }
#   php::extension { ['php-mysql'], ['php-pgsql']: }
#
define php::extension(
  $ensure = installed
) {
  require php

  package { $name:
    ensure  => $ensure,
    notify  => Service['apache']
  }
}
