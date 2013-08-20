#
# spec file for package inGraph
#
# Copyright (c) 2012 mopp@gmx.net
#
# Revised and modified for RHEL support by Michael Friedrich
# Copyright (c) 2012-2013 Netways GMbH
#
# All modifications and additions to the file contributed by third parties
# remain the property of their copyright owners, unless otherwise agreed
# upon. The license for this file, and modifications and additions to the
# file, is the same license as for the pristine package itself (unless the
# license for the pristine package is not an Open Source License, in which
# case the license is the MIT License). An "Open Source License" is a
# license that conforms to the Open Source Definition (Version 1.9)
# published by the Open Source Initiative.
 
Name:		inGraph
Summary:	NETWAYS inGraph Addon for Icinga/Nagios
Version:	1.0.2
Release:	1%{?dist}%{?custom}
Url:		https://www.netways.org/projects/ingraph/files
License:	GPL-3.0
Group:		System/Monitoring
Source:		%{name}-%{version}.tar.gz
BuildRoot:	%{_tmppath}/%{name}-%{version}-%{release}-root

%if "%{_vendor}" == "suse"
%if 0%{?suse_version} && 0%{?suse_version} <= 1110
%{!?python_sitelib: %global python_sitelib %(python -c "from distutils.sysconfig import get_python_lib; print get_python_lib()")}
%else
BuildArch:	noarch
%endif
%endif

%if 0%{?rhel} && 0%{?rhel} <= 5
%{!?python_sitelib: %global python_sitelib %(%{__python} -c "from distutils.sysconfig import get_python_lib; print(get_python_lib())")}
%{!?python_sitearch: %global python_sitearch %(%{__python} -c "from distutils.sysconfig import get_python_lib; print(get_python_lib(1))")}
%endif

Requires:	python >= 2.4.0
%if "%{_vendor}" == "suse"
Requires:	python-SQLAlchemy >= 0.6.0
Requires:	python-mysql
%else
#Requires:	python-sqlalchemy >= 0.6.0
Requires:       MySQL-python
#EL6 ship 0.5.5 only
%endif
BuildRequires:	python-devel
BuildRequires:	python-setuptools
%if "%{_vendor}" == "suse"
Requires(pre):	%fillup_prereq
Requires(pre):	%insserv_prereq
BuildRequires:	fdupes
%endif

%if "%{_vendor}" == "suse"
%define apacheconfdir {%_sysconfdir}/apache2/conf.d
%define apacheuser wwwrun
%define apachegroup www
%define docdir %{_defaultdocdir}
%endif
%if "%{_vendor}" == "redhat"
%define apacheconfdir %{_sysconfdir}/httpd/conf.d
%define apacheuser apache
%define apachegroup apache
%define docdir %{_defaultdocdir}
%endif
%define icingawebdir /usr/share/icinga-web
%define clearcache %{_sbindir}/icinga-web-clearcache
%define ingraphwebdir /usr/share/ingraph-web
%define ingraphwebclearcache /usr/share/ingraph-web/bin/clearcache.sh

%description
Netways inGraph is a flexible, open source charting tool for Icinga and Nagios, which collects performance data in a database and displays the results in a web interface.
This package only contains the backend daemons, frontend packages are seperated.

%package web
Summary:        %{name} web user interface (standalone)
Group:          Applications/System
Requires:       %{name} = %{version}-%{release}
%if "%{_vendor}" == "suse"
Requires:	php5-curl
Requires:	php5-xmlrpc
%endif
%if "%{_vendor}" == "redhat"
Requires:	php-xmlrpc
%endif

%description web
This package contains the %{name} standalone web interface.

%package icinga-web
Summary:        %{name} web user interface (icinga web)
Group:          Applications/System
Requires:	icinga-web >= 1.6.0
%if "%{_vendor}" == "suse"
Requires:	php5-curl
Requires:	php5-xmlrpc
%endif
%if "%{_vendor}" == "redhat"
Requires:	php-xmlrpc
%endif

%description icinga-web
This package contains the %{name} web interface integrated into
Icinga Web.


%prep
#uFIXME
#%setup -qn ingraph
#%setup -qn ingraph-ingraph
%setup -qn %{name}-%{version}

%build

%install
%{__rm} -rf %{buildroot}

# Install backend
python setup.py install --prefix=%{_prefix} --root=%{buildroot}

%if "%{_vendor}" == "suse"
# Install sysconfig templates
%{__mkdir_p} %{buildroot}%{_localstatedir}/adm/fillup-templates/
install -D -m 644 contrib/init.d/ingraph.sysconfig.suse %{buildroot}%{_localstatedir}/adm/fillup-templates/sysconfig.ingraph
install -D -m 644 contrib/init.d/ingraph-collector.sysconfig.suse %{buildroot}%{_localstatedir}/adm/fillup-templates/sysconfig.ingraph-collector
%endif
%if "%{_vendor}" == "redhat"
install -D -m 644 contrib/init.d/ingraph.sysconfig.rhel %{buildroot}%{_sysconfdir}/sysconfig/ingraph
install -D -m 644 contrib/init.d/ingraph-collector.sysconfig.rhel %{buildroot}%{_sysconfdir}/sysconfig/ingraph-collector
%endif

# Install db creation scripts
%{__mkdir_p} %{buildroot}%{_defaultdocdir}/%{name}/examples/
install -D -m 755 contrib/mysql/create-mysql-db.sh %{buildroot}%{_defaultdocdir}/%{name}/examples/

# Install inGraph documentation and sample modifications for icinga
install -D -m 755 contrib/icinga/add_perfdata_processing_commands.sh %{buildroot}%{_defaultdocdir}/%{name}/examples/
install -D -m 755 contrib/icinga/enable_perfdata_processing.sh %{buildroot}%{_defaultdocdir}/%{name}/examples/
%if "%{_vendor}" == "suse"
%{__mkdir_p} %{buildroot}%{_localstatedir}/lib/icinga/perfdata
%endif
%if "%{_vendor}" == "redhat"
%{__mkdir_p} %{buildroot}%{_localstatedir}/spool/icinga/perfdata
%endif

# Install frontend for standalone Web
cd ingraph-web/
# To prevent copy and permission problems use the current user for installation.
# Permissions are corrected in the RPM
./setup-ingraph-web.sh --install --prefix=%{buildroot}%{ingraphwebdir} --with-web-user=$(%{__id} -un) --with-web-group=$(%{__id} -gn)
# fix prefix
%{__sed} -i "s@CACHEDIR=.*@CACHEDIR='%{ingraphwebdir}/app/cache'@g" %{buildroot}%{ingraphwebdir}/bin/clearcache.sh
# install apache config
%{__sed} -i 's@Alias /ingraph.*@Alias /ingraph %{ingraphwebdir}/pub@g' ingraph.conf
%{__sed} -i 's@<Directory.*@<Directory %{ingraphwebdir}/pub>@g' ingraph.conf
%{__mkdir_p} %{buildroot}%{apacheconfdir}
install -m 644 ingraph.conf %{buildroot}%{apacheconfdir}
cd ..

# Install frontend for Icinga Web
%{__mkdir_p} %{buildroot}%{icingawebdir}/app/config
#Simulating an installed icinga version >= 1.6.n
cat << EOF > %{buildroot}%{icingawebdir}/app/config/icinga.xml
<setting name="version.major">1</setting>
<setting name="version.minor">6</setting>
EOF
cd icinga-web/
# To prevent copy and permission problems use the current user for installation.
# Permissions are corrected in the RPM
./setup-icinga-web.sh --install --prefix=%{buildroot}%{icingawebdir} --with-web-user=$(%{__id} -un) --with-web-group=$(%{__id} -gn)
rm %{buildroot}%{icingawebdir}/app/config/icinga.xml
cd ..

# 
%if "%{_vendor}" == "suse"
%{__mkdir_p} %{buildroot}%{_sbindir}
%{__ln_s} ../../%{_sysconfdir}/init.d/ingraph  "%{buildroot}%{_sbindir}/rcingraph"
%{__ln_s} ../../%{_sysconfdir}/init.d/ingraph-collector  "%{buildroot}%{_sbindir}/rcingraph-collector"

%if 0%{?suse_version} > 1010
%fdupes %{buildroot}%{_prefix}
%endif

%endif

%pre
%{_sbindir}/useradd -c 'inGraph User' -G icinga -s /sbin/nologin -r ingraph 2> /dev/null || :

%post
%if "%{_vendor}" == "suse"
%{fillup_and_insserv -n ingraph}
%{fillup_and_insserv -n ingraph-collector}
%endif
%if "%{_vendor}" == "redhat"
/sbin/chkconfig --add ingraph
/sbin/chkconfig --add ingraph-collector
%endif

%post web
if [[ -x %{ingraphwebclearcache} ]]; then %{ingraphwebclearcache}; fi

%post icinga-web
if [[ -x %{clearcache} ]]; then %{clearcache}; fi

%preun
%if "%{_vendor}" == "suse"
%stop_on_removal ingraph-collector
%stop_on_removal ingraph
%endif
%if "%{_vendor}" == "redhat"
if [ $1 -eq 0 ]; then
    /sbin/service ingraph-collector stop &>/dev/null || :
    /sbin/service ingraph stop &>/dev/null || :
    /sbin/chkconfig --del ingraph-collector
    /sbin/chkconfig --del ingraph
fi
%endif


%postun
%if "%{_vendor}" == "suse"
%restart_on_update ingraph-collector
%restart_on_update ingraph
%{insserv_cleanup}
%endif

%postun web
if [[ -x %{ingraphwebclearcache} ]]; then %{ingraphwebclearcache}; fi

%postun icinga-web
if [[ -x %{clearcache} ]]; then %{clearcache}; fi

%files 
%defattr(-,root,root)
%if "%{_vendor}" == "suse"
%{_sbindir}/rcingraph
%{_sbindir}/rcingraph-collector
%doc doc/AUTHORS doc/LICENSE doc/README doc/TODO doc/ChangeLog doc/README.SUSE
%endif
%if "%{_vendor}" == "redhat"
%doc doc/AUTHORS doc/LICENSE doc/README doc/TODO doc/ChangeLog doc/README.RHEL
%endif
%attr(755,root,root) %{_defaultdocdir}/%{name}/examples/
%if "%{_vendor}" == "suse"
%{_localstatedir}/adm/fillup-templates/sysconfig.ingraph*
%endif
%dir %{_sysconfdir}/ingraph
%config(noreplace) %{_sysconfdir}/ingraph/ingraph-aggregates.conf
%config(noreplace) %{_sysconfdir}/ingraph/ingraph-database.conf
%config(noreplace) %{_sysconfdir}/ingraph/ingraph-xmlrpc.conf
%attr(0755,root,root) %{_sysconfdir}/init.d/ingraph
%attr(0755,root,root) %{_sysconfdir}/init.d/ingraph-collector
%if "%{_vendor}" == "redhat"
%{_sysconfdir}/sysconfig/ingraph
%{_sysconfdir}/sysconfig/ingraph-collector
%endif
%attr(0755,root,root) %{_bindir}/check_ingraph
%attr(0755,root,root) %{_bindir}/ingraph-collectord
%attr(0755,root,root) %{_bindir}/ingraphd
%{python_sitelib}
%attr(0755,root,root) %{python_sitelib}/ingraph/bin/check_ingraph.py
%attr(0755,root,root) %{python_sitelib}/ingraph/bin/ingraph_collectord.py
%attr(0755,root,root) %{python_sitelib}/ingraph/bin/ingraphd.py
%if "%{_vendor}" == "suse"
%dir %attr(0775,icinga,icinga) %{_localstatedir}/lib/icinga
%dir %attr(0775,icinga,icinga) %{_localstatedir}/lib/icinga/perfdata
%endif
%if "%{_vendor}" == "redhat"
%dir %attr(0775,icinga,icinga) %{_localstatedir}/spool/icinga
%dir %attr(0775,icinga,icinga) %{_localstatedir}/spool/icinga/perfdata
%endif

%files web
%defattr(-,root,root)
%config(noreplace) %{apacheconfdir}/ingraph.conf
%defattr(-,icinga,icinga,-)
%dir %attr(0775,icinga,icinga) %{ingraphwebdir}
%{ingraphwebdir}
%attr(774,%{apacheuser},%{apachegroup}) %{ingraphwebdir}/app/cache
%attr(774,%{apacheuser},%{apachegroup}) %{ingraphwebdir}/app/modules/inGraph/cache
%config(noreplace) %attr(774,%{apacheuser},%{apachegroup}) %{ingraphwebdir}/app/modules/inGraph/config/templates/*
%config(noreplace) %attr(774,%{apacheuser},%{apachegroup}) %{ingraphwebdir}/app/modules/inGraph/config/views/*
%config(noreplace) %{ingraphwebdir}/app/modules/inGraph/config/inGraph.xml


%files icinga-web
%defattr(-,icinga,icinga,-)
%dir %{icingawebdir}
%{icingawebdir}
%config(noreplace) %attr(774,%{apacheuser},%{apachegroup}) %{icingawebdir}/app/modules/inGraph/config/templates/*
%config(noreplace) %attr(774,%{apacheuser},%{apachegroup}) %{icingawebdir}/app/modules/inGraph/config/views/*
%config(noreplace) %{icingawebdir}/app/modules/inGraph/config/inGraph.xml

%changelog
* Tue Aug 20 2013 michael.friedrich@netways.de
- split frontend into -web, -icinga-web sub packages

* Thu Aug 15 2013 michael.friedrich@netways.de
- change revision

* Wed Feb 13 2013 michael.friedrich@netways.de
- templates and views are config noreplace
- icinga web config must not be overwritten

* Fri Dec 21 2012 michael.friedrich@netways.de
- add support for rhel, while keeping suse support

* Tue Nov 27 2012 mopp@gmx.net
- Updated to inGraph 1.0.1
- Modified INSTALL documentation
- Minor changes to the spec file
* Sun Apr 29 2012 mopp@gmx.net
- initial package
