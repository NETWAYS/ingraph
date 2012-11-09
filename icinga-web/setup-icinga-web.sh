#!/bin/sh

set -o nounset

VERSION=1.0.1

SCRIPT=$(readlink -f "$0")
DIR=$(dirname "$SCRIPT")
COMMON_SRC=$(readlink -f "$DIR/../icinga-web")

PREFIX=${PREFIX-/usr/local/icinga-web}
WEB_USER=${WEB_USER-www-data}
WEB_GROUP=${WEB_GROUP-www-data}
XMLRPC_HOST=${XMLRPC_HOST-127.0.0.1}
XMLRPC_PORT=${XMLRPC_PORT-5000}
XMLRPC_USER=${XMLRPC_USER-ingraph}
XMLRPC_PASSWORD=${XMLRPC_PASSWORD-changeme}
NULL_TOLERANCE=${NULL_TOLERANCE-2}
TEMPLATE_SUFFIX=

FIND=${FIND-find}
INSTALL=${INSTALL-install}
SED=${SED-sed}
LN=${LN-ln}
TR=${TR-tr}
PATCH=${PATCH-patch}
GREP=${GREP-grep}
SHELL=${SHELL-sh}
GETENT=${GETENT-getent}

usage () {
    echo
    echo "Install the inGraph icinga-web module version $VERSION"
    echo
    echo "Usage: $(basename $0) [OPTION]..."
    echo
    echo "Defaults for the options are specified in brackets."
    echo
    echo "Required options are:"
    echo "--install                 install the inGraph icinga-web module"
    echo "or"
    echo "--install-dev             install dev environment"
    echo
    echo "Help:"
    echo "-h, --help                display this help and exit"
    echo "-V, --version             display version information and exit"
    echo
    echo "Installation directories:"
    echo "--prefix=PREFIX           icinga-web installation prefix"
    echo "                          [$PREFIX]"
    echo
    echo "Configuration:"
    echo "--with-web-user           web user"
    echo "                          [$WEB_USER]"
    echo "--with-web-group          web group"
    echo "                          [$WEB_GROUP]"
    echo "--with-xmlrpc-host        xml-rpc host"
    echo "                          [$XMLRPC_HOST]"
    echo "--with-xmlrpc-port        xml-rpc port"
    echo "                          [$XMLRPC_PORT]"
    echo "--with-xmlrpc-user        xml-rpc user"
    echo "                          [$XMLRPC_USER]"
    echo "--with-xmlrpc-password    xml-rpc password"
    echo "                          [$XMLRPC_PASSWORD]"
    echo "--with-null-tolerance     null tolerance value"
    echo "                          [$NULL_TOLERANCE]"
    echo
    exit 1
}

version () {
    echo $VERSION
    exit 1
}

# Execute in a subshell
install_files () (
    D=$1
    DEST=$2
    INSTALL_OPTS=${3-}
    
    # Exclude .in suffixed files and inGraph.xml
    FILES=$(for F in $($FIND $D -maxdepth 1 -type f ! -name \*.in ! -path \*/config/inGraph.xml); do echo $F; done)
    
    [ -n "$FILES" ] && $INSTALL -m 644 $INSTALL_OPTS -t $DEST $FILES
)

INSTALL_DEFAULT=0
INSTALL_DEV=0

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
        --prefix*)
            PREFIX=${ARG#--prefix}
            PREFIX=${PREFIX#=}
            [ -z "$PREFIX" ] && {
                echo "ERROR: expected an absolute directory name for --prefix." >&2
                exit 1
            }
            ;;
        --with-web-user*)
            WEB_USER=${ARG#--with-web-user}
            WEB_USER=${WEB_USER#=}
            [ -z "$WEB_USER" ] && {
                echo "ERROR: expected a web user." >&2
                exit 1
            }
            ;;
        --with-web-group*)
            WEB_GROUP=${ARG#--with-web-group}
            WEB_GROUP=${WEB_GROUP#=}
            [ -z "$WEB_GROUP" ] && {
                echo "ERROR: expected a web group." >&2
                exit 1
            }
            ;;
        --with-xmlrpc-host*)
            XMLRPC_HOST=${ARG#--with-xmlrpc-host}
            XMLRPC_HOST=${XMLRPC_HOST#=}
            [ -z "$XMLRPC_HOST" ] && {
                echo "ERROR: expected a xml-rpc host." >&2
                exit 1
            }
            ;;
        --with-xmlrpc-port*)
            XMLRPC_PORT=${ARG#--with-xmlrpc-port}
            XMLRPC_PORT=${XMLRPC_PORT#=}
            [ -z "$XMLRPC_PORT" ] && {
                echo "ERROR: expected a xml-rpc port." >&2
                exit 1
            }
            ;;
        --with-xmlrpc-user*)
            XMLRPC_USER=${ARG#--with-xmlrpc-user}
            XMLRPC_USER=${XMLRPC_USER#=}
            [ -z "$XMLRPC_USER" ] && {
                echo "ERROR: expected a xml-rpc user." >&2
                exit 1
            }
            ;;
        --with-xmlrpc-password*)
            XMLRPC_PASSWORD=${ARG#--with-xmlrpc-password}
            XMLRPC_PASSWORD=${XMLRPC_PASSWORD#=}
            [ -z "$XMLRPC_PASSWORD" ] && {
                echo "ERROR: expected a xml-rpc password." >&2
                exit 1
            }
            ;;
        --with-null-tolerance*)
            NULL_TOLERANCE=${ARG#--with-null-tolerance}
            NULL_TOLERANCE=${NULL_TOLERANCE#=}
            [ -z "$NULL_TOLERANCE" ] && {
                echo "ERROR: expected a numeric value." >&2
                exit 1
            }
            ;;
        --help | -h)
            usage
            ;;
        --version | -V)
            version
            ;;
        *)
            echo "WARN: Unknown option (ignored): $ARG" >&2
            ;;
    esac
done

if [ $INSTALL_DEFAULT -eq 0 ] && [ $INSTALL_DEV -eq 0 ]
then
    echo "ERROR: Required option --install or --install-dev missing" >&2

    usage
fi

$GETENT passwd $WEB_USER > /dev/null
[ $? -ne 0 ] && {
    echo "ERROR: Web user $WEB_USER: no such user" >&2
    
    usage
}

$GETENT group $WEB_GROUP > /dev/null
[ $? -ne 0 ] && {
    echo "ERROR: Web group $WEB_GROUP: no such group" >&2
    
    usage
}

# Remove trailing / from prefix (if existing)
PREFIX=${PREFIX%%/}

# Set tab and newline as input field separator
IFS="$(printf '\n\t')"

# Use tab as separator
tab="$(printf '\t')"

echo "(1/5) Validating icinga-web installation..."

ICINGA_XML=$PREFIX/app/config/icinga.xml
[ ! -r "$ICINGA_XML" ] && {
    echo "ERROR: icinga-web not found" >&2
    exit 1
}

VERSION=$($GREP \<setting\ name=\"version.minor\"\> $ICINGA_XML | $TR -dc [0-9])
[ $VERSION -lt 5 ] && {
    echo "ERROR: icinga-web versions older than 1.5.0 are not supported" >&2
    exit 1
}

echo "(2/5) Applying patches if necessary (icinga-web < 1.6.0)..."

[ $VERSION -lt 6 ] && {
    $PATCH --dry-run $PREFIX/app/modules/Cronks/lib/template/CronkGridTemplateXmlParser.class.php icinga-web-1.5.x.patch > /dev/null
    [ $? -eq 0 ] && {
        $PATCH $PREFIX/app/modules/Cronks/lib/template/CronkGridTemplateXmlParser.class.php icinga-web-1.5.x.patch
    } || {
        echo "WARN: Unable to apply icinga-web patch" >&2
    }
}

# Prepare *.in files
echo "(3/5) Preparing *.in files..."

[ $VERSION -lt 8 ] && {
    # Icinga-web's grid integration configuration changed with version 1.8
    TEMPLATE_SUFFIX="-legacy"
}

for FIN in $($FIND $DIR -type f -name \*.in)
do
    F=${FIN%.in}
    $INSTALL -m 644 $FIN $F
    $SED -i -e s,@PREFIX@,$PREFIX, $F
    $SED -i -e s,@WEB_USER@,$WEB_USER, $F
    $SED -i -e s,@WEB_GROUP@,$WEB_GROUP, $F
    $SED -i -e s,@XMLRPC_HOST@,$XMLRPC_HOST, $F
    $SED -i -e s,@XMLRPC_PORT@,$XMLRPC_PORT, $F
    $SED -i -e s,@XMLRPC_USER@,$XMLRPC_USER, $F
    $SED -i -e s,@XMLRPC_PASSWORD@,$XMLRPC_PASSWORD, $F
    $SED -i -e s,@NULL_TOLERANCE@,$NULL_TOLERANCE, $F
    $SED -i -e s,@TEMPLATE_SUFFIX@,$TEMPLATE_SUFFIX, $F
done

# Install from the inGraph directory
echo "(4/5) Installing directories and files..."

SRC=$DIR/inGraph

if [ $INSTALL_DEV -eq 1 ]
then
    $LN -s -t $PREFIX/app/modules $SRC
else
    for D in $($FIND $SRC -type d ! -path $SRC/config/templates ! -path $SRC/config/views)
    do
        $INSTALL -m 755 -d $PREFIX/app/modules/inGraph${D##$SRC}
    
        [ $? -eq 0 ] && install_files "$D" "$PREFIX/app/modules/inGraph${D##$SRC}"
    done
    
    for D in $($FIND $SRC -type d -path $SRC/config/templates -o -path $SRC/config/views)
    do
        $INSTALL -m 755 -o $WEB_USER -g $WEB_GROUP -d $PREFIX/app/modules/inGraph${D##$SRC}
        
        [ $? -eq 0 ] && install_files "$D" "$PREFIX/app/modules/inGraph${D##$SRC}" "-o${tab}$WEB_USER${tab}-g${tab}$WEB_GROUP${tab}-C${tab}-b"
    done
    
    # If inGraph.xml does not exist install it
    [ ! -r $PREFIX/app/modules/inGraph/config/inGraph.xml ] && {
        $INSTALL -m 644 -t $PREFIX/app/modules/inGraph/config $SRC/config/inGraph.xml
    }
fi

echo "(5/5) Invoking clearCache..."
$SHELL $PREFIX/bin/clearcache.sh

exit 0
