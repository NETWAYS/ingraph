#!/bin/bash
set -e

COMMANDS_CFG=$1
[ -z "$COMMANDS_CFG" ] && {
    echo "Required first argument commands.cfg missing."
    exit 1
}

PERFDATADIR=$2
[ -z "$PERFDATADIR" ] && {
    echo "Required second argument perfdata dir missing."
    exit 1
}


grep 'process-service-perfdata-file' $COMMANDS_CFG || echo "
define command {
    command_name    process-service-perfdata-file
    command_line    mv $PERFDATADIR/service-perfdata $PERFDATADIR/service-perfdata.\$TIMET$
}" >> $COMMANDS_CFG

grep 'process-host-perfdata-file' $COMMANDS_CFG || echo "
define command {
    command_name    process-host-perfdata-file
    command_line    mv $PERFDATADIR/host-perfdata $PERFDATADIR/host-perfdata.\$TIMET$
}" >> $COMMANDS_CFG
