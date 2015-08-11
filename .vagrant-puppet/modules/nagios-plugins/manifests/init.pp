# Class: nagios-plugins
#
#   This class installs the Monitoring Plugins.
#
# Parameters:
#
# Actions:
#
# Requires:
#
#   epel
#
# Sample Usage:
#
#   include nagios-plugins
#
class nagios-plugins {
  require epel

  package { 'nagios-plugins-all':
    ensure => installed
  }
}
