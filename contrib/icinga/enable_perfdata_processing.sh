#!/bin/bash

set -e

ICINGA_CFG=$1
[ -z "$ICINGA_CFG" ] && {
    echo "ERROR: Required first argument icinga.cfg missing" >&2
    exit 1
}

PERFDATADIR=$2
[ -z "$PERFDATADIR" ] && {
    echo "ERROR: Required second argument perfdata dir missing" >&2
    exit 1
}

sed -ri 's,^#?(process_performance_data=).*$,\11,' $ICINGA_CFG

sed -ri "s,^#?(service_perfdata_file=).*$,\1$PERFDATADIR/service-perfdata," $ICINGA_CFG
sed -ri 's,^#?(service_perfdata_file_template=).*$,\1DATATYPE::SERVICEPERFDATA\\tTIMET::$TIMET$\\tHOSTNAME::$HOSTNAME$\\tSERVICEDESC::$SERVICEDESC$\\tSERVICEPERFDATA::$SERVICEPERFDATA$\\tSERVICECHECKCOMMAND::$SERVICECHECKCOMMAND$\\tHOSTSTATE::$HOSTSTATE$\\tHOSTSTATETYPE::$HOSTSTATETYPE$\\tSERVICESTATE::$SERVICESTATE$\\tSERVICESTATETYPE::$SERVICESTATETYPE$,' $ICINGA_CFG
sed -ri 's,^#?(service_perfdata_file_mode=).*$,\1a,' $ICINGA_CFG
sed -ri 's,^#?(service_perfdata_file_processing_interval=).*$,\130,' $ICINGA_CFG
sed -ri 's,^#?(service_perfdata_file_processing_command=).*$,\1process-service-perfdata-file,' $ICINGA_CFG

sed -ri "s,^#?(host_perfdata_file=).*$,\1$PERFDATADIR/host-perfdata," $ICINGA_CFG
sed -ri 's,^#?(host_perfdata_file_template=).*$,\1DATATYPE::HOSTPERFDATA\\tTIMET::$TIMET$\\tHOSTNAME::$HOSTNAME$\\tHOSTPERFDATA::$HOSTPERFDATA$\\tHOSTCHECKCOMMAND::$HOSTCHECKCOMMAND$\\tHOSTSTATE::$HOSTSTATE$\\tHOSTSTATETYPE::$HOSTSTATETYPE$,' $ICINGA_CFG
sed -ri 's,^#?(host_perfdata_file_mode=).*$,\1a,' $ICINGA_CFG
sed -ri 's,^#?(host_perfdata_file_processing_interval=).*$,\130,' $ICINGA_CFG
sed -ri 's,^#?(host_perfdata_file_processing_command=).*$,\1process-host-perfdata-file,' $ICINGA_CFG
