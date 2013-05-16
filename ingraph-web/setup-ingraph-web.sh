#!/bin/sh
#
# Copyright (C) 2012 NETWAYS GmbH, http://netways.de
#
# This file is part of inGraph.
#
# inGraph is free software: you can redistribute it and/or modify it under
# the terms of the GNU General Public License as published by the Free Software
# Foundation, either version 3 of the License, or any later version.
#
# inGraph is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE. See the GNU General Public License for mor
# details.
#
# You should have received a copy of the GNU General Public License along with
# inGraph. If not, see <http://www.gnu.org/licenses/gpl.html>.
#

set -o nounset

VERSION=1.0.2

SCRIPT=$(readlink -f "$0")
DIR=$(dirname "$SCRIPT")
COMMON_SRC=$(readlink -f "$DIR/../icinga-web")

PREFIX=${PREFIX-/usr/local/ingraph-web}
WEB_USER=${WEB_USER-www-data}
WEB_GROUP=${WEB_GROUP-www-data}
WEB_PATH=${WEB_PATH-/ingraph}
XMLRPC_HOST=${XMLRPC_HOST-127.0.0.1}
XMLRPC_PORT=${XMLRPC_PORT-5000}
XMLRPC_USER=${XMLRPC_USER-ingraph}
XMLRPC_PASSWORD=${XMLRPC_PASSWORD-changeme}
NULL_TOLERANCE=${NULL_TOLERANCE-2}
NODE_BIN=
WEB_CACHE_DIR=${WEB_CACHE_DIR-$PREFIX/app/cache}

FIND=${FIND-find}
INSTALL=${INSTALL-install}
SED=${SED-sed}
LN=${LN-ln}
GETENT=${GETENT-getent}

usage () {
    echo
    echo "Install the inGraph web-interface version $VERSION"
    echo
    echo "Usage: $(basename $0) [OPTION]..."
    echo
    echo "Defaults for the options are specified in brackets."
    echo
    echo "Required options are:"
    echo "--install                 install the inGraph web interface"
    echo "or"
    echo "--install-dev             install dev environment"
    echo
    echo "Help:"
    echo "-h, --help                display this help and exit"
    echo "-V, --version             display version information and exit"
    echo
    echo "Installation directories:"
    echo "--prefix=PREFIX           installation prefix"
    echo "                          [$PREFIX]"
    echo "--with-cache-dir=CACHEDIR standalone web cache dir"
    echo "                          [$WEB_CACHE_DIR]"
    echo
    echo "Configuration:"
    echo "--with-web-user           web user"
    echo "                          [$WEB_USER]"
    echo "--with-web-group          web group"
    echo "                          [$WEB_GROUP]"
    echo "--with-web-path           web path"
    echo "                          [$WEB_PATH]"
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
    echo "--with-node-bin           Path to Node.js binary"
    echo "                          [$NODE_BIN]"
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

# Execute in a subshell
install_common_directories () (
    DIRS=$1
    SRC=$2
    # Remove trailing / from dest (if existing)
    DEST=${3%%/}
    INSTALL_OPTS=${4-}

    for TD in $DIRS
    do
        if [ $INSTALL_DEV -eq 1 ]
        then
            if [ ! -h "$DEST/$TD" ]
            then
                if [ -d "$DEST/$TD" ]
                then
                    SUBDIRS=$(for SD in $($FIND $SRC/$TD -maxdepth 1 -type d); do echo ${SD##$SRC/$TD}; done)
                    install_common_directories "$SUBDIRS" "$SRC/$TD" "$DEST/$TD"
                    for F in $(for F in $($FIND $SRC/$TD -maxdepth 1 -type f); do echo $F; done)
                    do
                        $LN -s $F $DEST/$TD
                    done
                else
                    $LN -s "$SRC/$TD" -t "$DEST"
                fi
            fi
        else
            for D in $($FIND $SRC/$TD -type d)
            do
                $INSTALL -m 755 $INSTALL_OPTS -d "$DEST${D##$SRC}"

                [ $? -eq 0 ] && install_files "$D" "$DEST${D##$SRC}" "$INSTALL_OPTS"
            done
        fi
    done
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
        --with-cache-dir*)
            WEB_CACHE_DIR=${ARG#--with-cache-dir}
            WEB_CACHE_DIR=${WEB_CACHE_DIR#=}
            [ -z "$WEB_CACHE_DIR" ] && {
                echo "ERROR: expected an absolute directory name for --with-cache-dir." >&2
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
        --with-web-path*)
            WEB_PATH=${ARG#--with-web-path}
            WEB_PATH=${WEB_PATH#=}
            [ -z "$WEB_PATH" ] && {
                echo "ERROR: expected a web path." >&2
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
        --with-node-bin*)
            NODE_BIN=${ARG#--with-node-bin}
            NODE_BIN=${NODE_BIN#=}
            [ -z "$NODE_BIN" ] && {
                echo "ERROR: expected an absolute directory name for --with-node-bin." >&2
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

PREFIX=${PREFIX%%/} # Remove trailing / from prefix (if existing)

# Set tab and newline as input field separator
IFS="$(printf '\n\t')"
# Use tab as separator
tab="$(printf '\t')"

echo "(1/4) Preparing *.in files..."

# Prepare *.in files
for FIN in $($FIND $DIR -type f -name \*.in)
do
    F=${FIN%.in}
    $INSTALL -m 644 $FIN $F
    $SED -i -e s,@PREFIX@,$PREFIX, $F
    $SED -i -e s,@WEB_CACHE_DIR@,$WEB_CACHE_DIR, $F
    $SED -i -e s,@WEB_USER@,$WEB_USER, $F
    $SED -i -e s,@WEB_GROUP@,$WEB_GROUP, $F
    $SED -i -e s,@WEB_PATH@,$WEB_PATH, $F
    $SED -i -e s,@XMLRPC_HOST@,$XMLRPC_HOST, $F
    $SED -i -e s,@XMLRPC_PORT@,$XMLRPC_PORT, $F
    $SED -i -e s,@XMLRPC_USER@,$XMLRPC_USER, $F
    $SED -i -e s,@XMLRPC_PASSWORD@,$XMLRPC_PASSWORD, $F
    $SED -i -e s,@NULL_TOLERANCE@,$NULL_TOLERANCE, $F
    $SED -i -e s,@NODE_BIN@,$NODE_BIN, $F
done

# Install files from the ingraph directory
echo "(2/4) Installing directories and files..."

SRC=$DIR/ingraph

# Install all "base" files from the ingraph folder
# Exclude bin files will since they will be installed separately
for D in $($FIND $SRC -type d ! -path $SRC/bin)
do
    $INSTALL -m 755 -d $PREFIX${D##$SRC}

    [ $? -eq 0 ] && install_files "$D" "$PREFIX${D##$SRC}"
done

# Install bin files
$INSTALL -m 755 -d $PREFIX/bin
BINFILES=$(for F in $($FIND $SRC/bin -maxdepth 1 -type f ! -name \*.in); do echo $F; done)
[ -n "$BINFILES" ] && $INSTALL -m 755 -t $PREFIX/bin $BINFILES

echo "(3/4) Installing cache and log directory..."

$INSTALL -m 755 -o $WEB_USER -g $WEB_GROUP -d $PREFIX/app/log $PREFIX/app/cache

# Install direcotries and files from icinga-web module
echo "(4/4) Installing directories and files from common source..."

install_common_directories "Comments${tab}Provider${tab}Templates${tab}Views" $COMMON_SRC/inGraph/actions $PREFIX/app/modules/inGraph/actions
install_common_directories "Comments${tab}Provider${tab}Templates${tab}Views" $COMMON_SRC/inGraph/cache $PREFIX/app/modules/inGraph/cache
install_common_directories "Comments${tab}Provider${tab}Templates${tab}Views" $COMMON_SRC/inGraph/templates $PREFIX/app/modules/inGraph/templates
install_common_directories "Comments${tab}Provider${tab}Templates${tab}Views" $COMMON_SRC/inGraph/validate $PREFIX/app/modules/inGraph/validate
install_common_directories "Comments${tab}Provider${tab}Templates${tab}Views" $COMMON_SRC/inGraph/views $PREFIX/app/modules/inGraph/views
install_common_directories "js${tab}styles" $COMMON_SRC/inGraph/lib $PREFIX/pub
# Backup modified templates
if [ -d "$PREFIX/app/modules/inGraph/config/templates" ] && [ "$(ls -A "$PREFIX/app/modules/inGraph/config/templates")" ]
then
    for TEMPLATE in $PREFIX/app/modules/inGraph/config/templates/*.json
    do
        if [ "$(md5sum "$COMMON_SRC/inGraph/config/templates/${TEMPLATE##$PREFIX/app/modules/inGraph/config/templates/}" | cut -d ' ' -f 1)" != "$(md5sum "$TEMPLATE" | cut -d ' ' -f 1)" ]
        then
            cp -u -b "$TEMPLATE" "${TEMPLATE}.bak"
        fi
    done
fi
install_common_directories "templates${tab}views" $COMMON_SRC/inGraph/config $PREFIX/app/modules/inGraph/config "-o${tab}$WEB_USER${tab}-g${tab}$WEB_GROUP${tab}"
install_common_directories "action${tab}js${tab}model${tab}nodejs${tab}php${tab}validator${tab}view" $COMMON_SRC/inGraph/lib $PREFIX/app/modules/inGraph/lib

# Install config xmls
CONFIGS="$COMMON_SRC/inGraph/config/autoload.xml${tab}\
$COMMON_SRC/inGraph/config/config_handlers.xml${tab}\
$COMMON_SRC/inGraph/config/validators.xml"
$INSTALL -m 644 -t $PREFIX/app/modules/inGraph/config/ $CONFIGS

# Install styles
STYLES=$(for F in $($FIND $COMMON_SRC/inGraph/pub/styles -maxdepth 1 -type f ! -name \*.in); do echo $F; done)
[ -n "$STYLES" ] && $INSTALL -m 644 -t $PREFIX/pub/styles/ $STYLES

# Install images
IMAGES=$(for F in $($FIND $COMMON_SRC/inGraph/pub/images -maxdepth 1 -type f ! -name \*.in); do echo $F; done)
[ -n "$IMAGES" ] && $INSTALL -m 644 -t $PREFIX/pub/images/ $IMAGES

# Install top-level files, e.g. config.php
FILES=$(for F in $($FIND $COMMON_SRC/inGraph/ -maxdepth 1 -type f ! -name \*.in); do echo $F; done)
[ -n "$FILES" ] && $INSTALL -m 644 -t $PREFIX/app/modules/inGraph $FILES

# If inGraph.xml does not exist install it from the icinga-web module
if [ ! -r $PREFIX/app/modules/inGraph/config/inGraph.xml ]
then
    # Duplicate code, maybe there's a nicer way
    $INSTALL -m 644 $COMMON_SRC/inGraph/config/inGraph.xml.in $PREFIX/app/modules/inGraph/config/inGraph.xml
    $SED -i s,@PREFIX@,$PREFIX, $PREFIX/app/modules/inGraph/config/inGraph.xml
    $SED -i s,@WEB_USER@,$WEB_USER, $PREFIX/app/modules/inGraph/config/inGraph.xml
    $SED -i s,@WEB_GROUP@,$WEB_GROUP, $PREFIX/app/modules/inGraph/config/inGraph.xml
    $SED -i s,@WEB_PATH@,$WEB_PATH, $PREFIX/app/modules/inGraph/config/inGraph.xml
    $SED -i s,@XMLRPC_HOST@,$XMLRPC_HOST, $PREFIX/app/modules/inGraph/config/inGraph.xml
    $SED -i s,@XMLRPC_PORT@,$XMLRPC_PORT, $PREFIX/app/modules/inGraph/config/inGraph.xml
    $SED -i s,@XMLRPC_USER@,$XMLRPC_USER, $PREFIX/app/modules/inGraph/config/inGraph.xml
    $SED -i s,@XMLRPC_PASSWORD@,$XMLRPC_PASSWORD, $PREFIX/app/modules/inGraph/config/inGraph.xml
    $SED -i s,@NULL_TOLERANCE@,$NULL_TOLERANCE, $PREFIX/app/modules/inGraph/config/inGraph.xml
    $SED -i s,@NODE_BIN@,$NODE_BIN, $PREFIX/app/modules/inGraph/config/inGraph.xml
fi

echo
echo "The httpd config has been created."
echo "Please copy or move ingraph.conf to the appropriate webserver configuration directory, e.g. /etc/apache2/conf.d, /etc/httpd/conf.d."
echo "In order to activate the configuration, please do not forget to restart the webserver."
echo

exit 0
