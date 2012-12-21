#
# spec file for package inGraph
#
# Copyright (c) 2012 mopp@gmx.net
#
# Revised and modified for RHEL support by Michael Friedrich
# Copyright (c) 2012 Netways GMbH
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
Summary:	NETWAYS inGraph Addon for Icinga
Version:	1.0.1
Release:	1.1
Url:		https://www.netways.org/projects/ingraph/files
License:	GPL-3.0
Group:		System/Monitoring
Source:		%{name}.%{version}.tar.gz
BuildRoot:	%{_tmppath}/%{name}-%{version}-build
%if "%{_vendor}" == "suse"
%if 0%{?suse_version} && 0%{?suse_version} <= 1110
%{!?python_sitelib: %global python_sitelib %(python -c "from distutils.sysconfig import get_python_lib; print get_python_lib()")}
%else
BuildArch:	noarch
%endif
%endif

#icinga-web >= 1.5.0 will work,but requires some additional patching
Requires:	icinga-web >= 1.6.0
Requires:	python >= 2.4.0
Requires:	python-SQLAlchemy >= 0.6.0
Requires:	python-mysql
%if "%{_vendor}" == "suse"
Requires:	php5-curl
Requires:	php5-xmlrpc
Requires(pre):	%fillup_prereq
Requires(pre):	%insserv_prereq
BuildRequires:	fdupes
%endif
%if "%{_vendor}" == "rhel"
Requires:	php-xmlrpc
%endif
BuildRequires:	python-devel
BuildRequires:	python-setuptools

%if "%{_vendor}" == "suse"
%define         apacheuser wwwrun
%define         apachegroup www
%define         docdir %{_defaultdocdir}
%endif
%if "%{_vendor}" == "rhel"
%define         apacheuser apache
%define         apachegroup apache
%define         docdir %{_defaultdocdir}
%endif
%define         icingawebdir /usr/share/icinga-web
%define         clearcache %{_sbindir}/icinga-web-clearcache

%description
Netways inGraph is a flexible, open source charting tool for Icinga and Nagios, which collects performance data in a database and displays the results in a web interface.

This package is optimized for Icinga-web and not the standalone version.

%prep
#uFIXME
#%setup -qn ingraph
%setup -qn ingraph-ingraph

%build

%install
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


# Install frontend for Icinga
%{__mkdir_p} %{buildroot}%{icingawebdir}/app/config
#Simulating an installed icinga version >= 1.6.n
cat << EOF > %{buildroot}%{icingawebdir}/app/config/icinga.xml
<setting name="version.major">1</setting>
<setting name="version.minor">6</setting>
EOF
cd icinga-web/
#./setup-icinga-web.sh --install --prefix=%{buildroot}%{icingawebdir} --with-web-user=%{apacheuser} --with-web-group=%{apachegroup}
# To prevent copy and permission problems use the current user for installation.
# Permissions are corrected in the RPM
./setup-icinga-web.sh --install --prefix=%{buildroot}%{icingawebdir} --with-web-user=$(%{__id} -un) --with-web-group=$(%{__id} -gn)
rm %{buildroot}%{icingawebdir}/app/config/icinga.xml

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
if [[ -x %{clearcache} ]]; then %{clearcache}; fi

%if "%{_vendor}" == "suse"
%{fillup_and_insserv -n ingraph}
%{fillup_and_insserv -n ingraph-collector}
%endif
%if "%{_vendor}" == "redhat"
/sbin/chkconfig --add ingraph
/sbin/chkconfig --add ingraph-collector
%endif

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
if [[ -x %{clearcache} ]]; then %{clearcache}; fi
%if "%{_vendor}" == "suse"
%restart_on_update ingraph-collector
%restart_on_update ingraph
%{insserv_cleanup}
%endif

%files 
%defattr(-,root,root)
%if "%{_vendor}" == "suse"
%{_sbindir}/rcingraph
%{_sbindir}/rcingraph-collector
%doc AUTHORS LICENSE README TODO README.SUSE
%endif
%if "%{_vendor}" == "redhat"
%doc AUTHORS LICENSE README TODO README.RHEL
%endif
%attr(755,root,root) %{_defaultdocdir}/%{name}/examples/
%attr(0755,%{apacheuser},%{apachegroup}) %{_datadir}/icinga-web/app/modules/inGraph/config/views/
%attr(0755,%{apacheuser},%{apachegroup}) %{_datadir}/icinga-web/app/modules/inGraph/config/templates/
%{_datadir}/icinga-web/
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
%{python_sitelib}/
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

%changelog
* Fri Dec 21 2012 michael.friedrich@netways.de
- add support for rhel, while keeping suse support

* Tue Nov 27 2012 mopp@gmx.net
- Updated to inGraph 1.0.1
- Modified INSTALL documentation
- Minor changes to the spec file
* Sun Apr 29 2012 mopp@gmx.net
- initial package
