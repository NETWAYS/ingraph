# Class: graphite
#
#   This class installs graphite.
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
#   include graphite
#
class graphite {
  require epel

  package { [ 'python-whisper', 'python-carbon', 'graphite-web' ]:
    ensure  => installed,
    require => Class['epel']
  }

  service { 'carbon-cache':
    enable  => true,
    ensure  => running,
    require => Package['python-carbon']
  }
}
