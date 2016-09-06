# Class: icinga-testconfig
#
#   This class installs test config for Icinga using Monitoring::Generator::TestConfig.
#
# Parameters:
#
# Actions:
#
# Requires:
#
#   icinga-mysql
#
class icinga-testconfig {
  require icinga-mysql

  Exec { path => '/bin:/usr/bin:/sbin' }

  cpan::module { 'Monitoring::Generator::TestConfig':
    creates => '/usr/local/share/perl5/Monitoring/Generator/TestConfig.pm',
    timeout => 600
  }

  file { '/usr/local/share/misc/monitoring_test_config':
    ensure  => directory,
    owner   => icinga,
    group   => icinga,
    alias   => 'monitoring-testconfig'
  }

  exec { 'create-testconfig':
    command => 'sudo /usr/local/bin/create_monitoring_test_config.pl -l icinga /usr/local/share/misc/monitoring_test_config',
    require => [ Cpan::Module['Monitoring::Generator::TestConfig'], File['monitoring-testconfig'] ]
  }

  file { '/etc/icinga/conf.d/test_config/':
    ensure  => directory,
    owner   => icinga,
    group   => icinga,
    alias   => 'etc-icinga'
  }

  define testconfig {
    file { "/etc/icinga/conf.d/test_config/${name}.cfg":
      owner   => 'icinga',
      group   => 'icinga',
      source  => "/usr/local/share/misc/monitoring_test_config/etc/conf.d/${name}.cfg",
      require => [ Exec['create-testconfig'], File['etc-icinga'] ],
      notify  => Service['icinga']
    }
  }

  define testplugin {
    file { "/usr/lib64/nagios/plugins/${name}":
      owner   => 'icinga',
      group   => 'icinga',
      source  => "/usr/local/share/misc/monitoring_test_config/plugins/${name}",
      require => [ Exec['create-testconfig'], File['etc-icinga'] ]
    }
  }

  testconfig { [ 'commands', 'contacts', 'dependencies', 'hostgroups', 'hosts', 'servicegroups', 'services' ]: }
  testplugin { [ 'test_hostcheck.pl', 'test_servicecheck.pl' ]: }
}
