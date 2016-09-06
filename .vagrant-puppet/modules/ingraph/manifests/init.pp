# Class: ingraph
#
#   This class prepares ingraph.
#
# Parameters:
#
# Actions:
#
# Requires:
#
#   graphite, apache, icinga-web
#
# Sample Usage:
#
#   include ingraph
#
class ingraph (
  $web_ip = '127.0.0.1',
  $web_port = '8080'
) {

  require icinga-web
  include icinga-mysql

  Exec { path => '/bin:/usr/bin:/sbin' }

  exec { 'create-mysql-ingraph-db':
    unless  => 'mysql -uingraph -pingraph ingraph',
    command => 'mysql -uroot -e "CREATE DATABASE ingraph; \
                GRANT ALL ON ingraph.* TO ingraph@localhost \
                IDENTIFIED BY \'ingraph\';"',
    require => Service['mysqld']
  }

  exec { 'setup-ingraph-daemons':
    cwd     => '/vagrant',
    command => 'sudo /bin/bash /vagrant/setup-daemons.sh --install --with-backend=carbon',
    require => Service['mysqld']
  }

  exec { 'setup-ingraph-web':
    cwd     => '/vagrant',
    command => 'sudo /bin/bash /vagrant/ingraph-web/setup-ingraph-web.sh --install --with-web-group=apache --with-web-user=apache',
    require => [ Service['mysqld'], Exec['setup-ingraph-daemons'] ]
  }

  file { '/usr/share/icinga-web/app/modules/inGraph/config/inGraph.xml':
    ensure => present,
    replace => true,
    force => true,
    content => template('ingraph/inGraph.xml.erb'),
    require => Exec['setup-icinga-web'],
    notify => Exec['icinga-web-clearcache']
  }

  exec { 'setup-ingraph-apache':
    cwd => '/vagrant',
    command => 'sudo mv /vagrant/ingraph-web/ingraph.conf /etc/httpd/conf.d/',
    require => Exec['setup-ingraph-web'],
    notify => Service['apache']
  }
  ->
  exec { 'icinga-web-clearcache':
    command => 'sudo /bin/bash icinga-web-clearcache',
    require => Exec['setup-ingraph-apache']
  }

  exec { 'setup-icinga-web':
    cwd => '/vagrant',
    command => 'sudo /bin/bash /vagrant/icinga-web/setup-icinga-web.sh --prefix=/usr/share/icinga-web --with-web-group=apache --with-web-user=apache --install-dev',
    notify => Service['apache']
  }

  file { [ '/usr/local/icinga', '/usr/local/icinga/var', '/usr/local/icinga/var/perfdata' ]:
    ensure => "directory",
    owner  => "icinga",
    group  => "icinga",
    mode   => 770
  }
  ->
  exec { 'enable-perfdata-processing':
    cwd => '/vagrant',
    command => 'sudo /bin/bash /vagrant/contrib/icinga/enable_perfdata_processing.sh /etc/icinga/icinga.cfg /usr/local/icinga/var/perfdata',
    notify => Service['icinga']
  }
  ->
  exec { 'add-perfdata-processing-commands':
    cwd => '/vagrant',
    command => 'sudo /bin/bash /vagrant/contrib/icinga/add_perfdata_processing_commands.sh /etc/icinga/objects/commands.cfg /usr/local/icinga/var/perfdata',
    notify => Service['icinga']
  }
}