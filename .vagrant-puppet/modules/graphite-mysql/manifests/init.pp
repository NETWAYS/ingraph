# Class: graphite-mysql
#
#   This class installs Carbon, Whipser and Graphite-web using a MySQL database.
#
# Parameters:
#
# Actions:
#
# Requires:
#
#   apache, epel, mysql
#
# Sample Usage:
#
#   include graphite-mysql
#
class graphite-mysql (
  $web_ip       = '*',
  $web_port     = '8080',
  $web_db_name  = 'graphite',
  $web_db_host  = 'localhost',
  $web_db_user  = 'graphite',
  $web_db_pass  = 'graphite',
  $web_db_port  = '3306'
) {
  include apache
  require epel
  require mysql

  $default_packages = [ 'python-whisper', 'python-carbon', 'graphite-web' ]

  case $::operatingsystem {
    /(Debian|Ubuntu)/:        { $packages = [ $default_packages, 'python-mysqldb' ] }
    /(RedHat|CentOS|Fedora)/: { $packages = [ $default_packages, 'MySQL-python' ] }
  }

  package { $packages:
    ensure  => installed,
    require => Package['apache']
  }

  service { 'carbon-cache':
    enable  => true,
    ensure  => running,
    require => Package['python-carbon']
  }

  exec { 'set-graphite-secret-key':
    command => "sed -i \"s/SECRET_KEY = 'UNSAFE_DEFAULT'/SECRET_KEY = '09a101ac07f07aef2e9d5a1099ef90c7'/\" \
                /usr/lib/python2.6/site-packages/graphite/settings.py",
    path    => '/bin:/usr/bin',
    require => Package['graphite-web'],
  }

  file { '/etc/httpd/conf.d/graphite-web.conf':
    content => template('graphite-mysql/graphite-web.conf.erb'),
    require => Package['graphite-web'],
    notify  => Service['apache']
  }

  file { '/etc/graphite-web/local_settings.py':
    content => template('graphite-mysql/local_settings.py.erb'),
    require => Package['graphite-web'],
    notify  => Service['apache']
  }

  exec { 'create-mysql-graphite-db':
    path    => '/bin:/usr/bin',
    unless  => "mysql -u${web_db_user} -p${web_db_pass} ${web_db_name}",
    command => "mysql -uroot -e \"CREATE DATABASE ${web_db_name}; \
                GRANT ALL ON ${web_db_name}.* TO ${web_db_user}@'localhost' IDENTIFIED BY '${web_db_pass}';\"",
    require => [ Package['graphite-web'] ]
  }

  exec { 'populate-mysql-graphite-db':
    path    => '/bin:/usr/bin',
    unless  => "mysql -u${web_db_user} -p${web_db_pass} ${web_db_name} -e \"SELECT * FROM auth_user;\" &> /dev/null",
    command => "mysql -u${web_db_user} -p${web_db_pass} ${web_db_name} < \
                /vagrant/.vagrant-puppet/modules/graphite-mysql/files/schema.sql",
    require => Exec['create-mysql-graphite-db'],
    notify  => Service['apache']
  }

#    package { 'iptables':
#      ensure => latest
#    }
#    -> exec { 'iptables-allow-grpahite':
#      path    => '/bin:/usr/bin',
#      unless  => "grep -qe \"-A INPUT -p tcp -m state --state NEW -m tcp --dport ${web_port} -j ACCEPT\" /etc/sysconfig/iptables",
#      command => "/sbin/iptables -I INPUT 1 -p tcp -m state --state NEW -m tcp --dport ${web_port} -j ACCEPT && /sbin/iptables-save > /etc/sysconfig/iptables",
#    }
}
