#!/bin/sh

set -o nounset

SCRIPT=$(readlink -f "$0")
DIR=$(dirname "$SCRIPT")

CONFIG_DIR=${CONFIG_DIR-/etc/ingraph}
LIB_DIR=${LIB_DIR-}
BIN_DIR=${BIN_DIR-}
XMLRPC_HOST=${XMLRPC_HOST-127.0.0.1}
XMLRPC_PORT=${XMLRPC_PORT-5000}
XMLRPC_USER=${XMLRPC_USER-ingraph}
XMLRPC_PASSWORD=${XMLRPC_PASSWORD-changeme}

PYTHON_OPTS=${PYTHON_OPTS-install}

FIND=${FIND-find}
INSTALL=${INSTALL-install}
SED=${SED-sed}
PYTHON=${PYTHON-python}

usage () {
    echo
    echo "Install the inGraph python backend"
    echo
    echo "Usage: $(basename $0) [OPTION]..."
    echo
    echo "Required options are:"
    echo "--install                 install the inGraph python backend"
    echo
    echo "Options (defaults are specified in brackets):"
    echo "--help, -h                display this help and exit"
    echo "--with-config-dir=DIR     installation directory for the config files"
    echo "                          [$CONFIG_DIR]"
    echo "--with-lib-dir=DIR        installation directory for the python module"
    echo "                          [python's site-config direcotry]"
    echo "--with-bin-dir=DIR        installation directory for scripts"
    echo "                          [May be one of /usr/bin, /usr/local/bin,"
    echo "                           /path/to/python/bin"
    echo "                           depending on your python installation]"
    echo "--with-xmlrpc-host        xml-rpc host"
    echo "                          [$XMLRPC_HOST]"
    echo "--with-xmlrpc-port        xml-rpc port"
    echo "                          [$XMLRPC_PORT]"
    echo "--with-xmlrpc-user        xml-rpc user"
    echo "                          [$XMLRPC_USER]"
    echo "--with-xmlrpc-password    xml-rpc password"
    echo "                          [$XMLRPC_PASSWORD]"
    echo
    exit 1
}

INSTALL_DEFAULT=0

# Parse command line args
for ARG in "$@"
do
    case "$ARG" in
        --install)
            INSTALL_DEFAULT=1
            ;;
        --install-dev)
            INSTALL_DEV=1
            ;;
        --with-config-dir*)
            CONFIG_DIR=${ARG#--with-config-dir}
            CONFIG_DIR=${CONFIG_DIR#=}
            [ -z "$CONFIG_DIR" ] && {
                echo "ERROR: expected an absolute directory name for --with-config-dir" >&2
                exit 1
            }
            ;;
        --with-lib-dir*)
            LIB_DIR=${ARG#--with-lib-dir}
            LIB_DIR=${LIB_DIR#=}
            [ -z "$LIB_DIR" ] && {
                echo "ERROR: expected an absolute directory name for --with-lib-dir" >&2
                exit 1
            }
            ;;
        --with-bin-dir*)
            BIN_DIR=${ARG#--with-bin-dir}
            BIN_DIR=${BIN_DIR#=}
            [ -z "$LIB_DIR" ] && {
                echo "ERROR: expected an absolute directory name for --with-bin-dir" >&2
                exit 1
            }
            ;;
        --with-xmlrpc-host*)
            XMLRPC_HOST=${ARG#--with-xmlrpc-host}
            XMLRPC_HOST=${XMLRPC_HOST#=}
            [ -z "$XMLRPC_HOST" ] && {
                echo "ERROR: expected a xml-rpc host" >&2
                exit 1
            }
            ;;
        --with-xmlrpc-port*)
            XMLRPC_PORT=${ARG#--with-xmlrpc-port}
            XMLRPC_PORT=${XMLRPC_PORT#=}
            [ -z "$XMLRPC_PORT" ] && {
                echo "ERROR: expected a xml-rpc port" >&2
                exit 1
            }
            ;;
        --with-xmlrpc-user*)
            XMLRPC_USER=${ARG#--with-xmlrpc-user}
            XMLRPC_USER=${XMLRPC_USER#=}
            [ -z "$XMLRPC_USER" ] && {
                echo "ERROR: expected a xml-rpc user" >&2
                exit 1
            }
            ;;
        --with-xmlrpc-password*)
            XMLRPC_PASSWORD=${ARG#--with-xmlrpc-password}
            XMLRPC_PASSWORD=${XMLRPC_PASSWORD#=}
            [ -z "$XMLRPC_PASSWORD" ] && {
                echo "ERROR: expected a xml-rpc password" >&2
                exit 1
            }
            ;;
        --help | -h)
            usage
            ;;
        *)
            echo "WARN: Unknown option (ignored): $ARG" >&2
            ;;
    esac
done

if [ $INSTALL_DEFAULT -eq 0 ]
then
    echo "ERROR: Required option --install missing" >&2

    usage
fi

PREFIX=${PREFIX%%/} # Remove trailing / from prefix (if existing)

echo "(1/2) Preparing *.in files..."

# Prepare *.in files
for FIN in $($FIND $DIR -type f -name \*.in)
do
    F=${FIN%.in}
    $INSTALL -m 644 $FIN $F
    $SED -i -e s,@CONFIG_DIR@,$CONFIG_DIR, $F
    $SED -i -e s,@XMLRPC_HOST@,$XMLRPC_HOST, $F
    $SED -i -e s,@XMLRPC_PORT@,$XMLRPC_PORT, $F
    $SED -i -e s,@XMLRPC_USER@,$XMLRPC_USER, $F
    $SED -i -e s,@XMLRPC_PASSWORD@,$XMLRPC_PASSWORD, $F
done

# Install files from the ingraph directory
echo "(2/2) Running setup.py..."

[ -n "$LIB_DIR" ] && {
    PYTHON_OPTS="$PYTHON_OPTS --install-lib=$LIB_DIR"
}
[ -n "$BIN_DIR" ] && {
    PYTHON_OPTS="$PYTHON_OPTS --install-scripts=$BIN_DIR"
}

$PYTHON setup.py $PYTHON_OPTS

exit 0
