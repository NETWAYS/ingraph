# Define: cpan::module
#
#   Download and install Perl modules from the Perl Archive Network, the canonical location for Perl code and modules.
#
# Parameters:
#   [*creates*]  - target directory the software will install to.
#   [*timeout* ] - timeout for the CPAN command.
#
# Actions:
#
# Requires:
#
#   cpan
#
# Sample Usage:
#
#   cpan { 'perl-module':
#     creates => '/usr/local/share/perl5/perl-module',
#     timeout => 600
#   }
#
define cpan::module(
  $creates,
  $timeout
) {
  require cpan

  exec { "cpan-${name}":
    path    => '/usr/bin',
    command => "sudo perl -MCPAN -e 'install ${name}'",
    creates => $creates,
    require => File['/root/.cpan/CPAN/MyConfig.pm'],
    timeout => $timeout
  }
}
