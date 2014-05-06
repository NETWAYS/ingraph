include icinga-mysql

include nagios-plugins

include icinga-web-mysql

@user { 'apache':
  groups  => ['icingacmd', 'vagrant'],
  require => Class['icinga-mysql']
}

@user { 'vagrant':
  groups  => 'icingacmd',
  require => Class['icinga-mysql']
}

realize( User[apache], User[vagrant] )

include xdebug
