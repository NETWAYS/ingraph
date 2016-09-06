# Class: cpan
#
# Parameters:
#   [*creates*]  - target directory the software will install to.
#   [*timeout* ] - timeout for the CPAN command.
#
# Actions:
#
# Requires:
#
# Sample Usage:
#
#   include cpan
#
class cpan(
) {
  Exec { path => '/usr/bin' }

  package { 'perl-CPAN':
    ensure => installed
  }

  file { [ '/root/.cpan/', '/root/.cpan/CPAN/' ]:
    ensure  => directory
  }

  file { '/root/.cpan/CPAN/MyConfig.pm':
    content => template('cpan/MyConfig.pm.erb'),
    require => [ Package['perl-CPAN'],
                 File[ [ '/root/.cpan/', '/root/.cpan/CPAN/' ] ] ]
  }
}
