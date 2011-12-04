#!/bin/sh
SCRIPT=`readlink -f $0`
DIR=`dirname $SCRIPT`
PREFIX=/usr/local/icinga-web

for ARG in $@
do
    case "$ARG" in
        --prefix*)
            PREFIX=${ARG#--prefix}
            PREFIX=${PREFIX#=}
            [ -z "$PREFIX" ] && {
                echo "ERROR: expected an absolute directory name for --prefix"
                exit 1
            }
            ;;
        --help)
            echo "Installs inGraph icinga-web module."
            echo
            echo "Usage: ./install.sh [OPTION]..."
            echo
            echo "Defaults for the options are specified in brackets."
            echo
            echo "--help              display this help and exit"
            echo "--prefix=PREFIX     install architecture-independent files in PREFIX"
            echo "                    [/usr/local/icinga-web]"
            exit 0
            ;;
        *)
            echo "WARNING: $ARG ignored"
            ;;
    esac
done

ICINGA_XML=$PREFIX/app/config/icinga.xml
[ ! -r "$ICINGA_XML" ] && {
    echo "No icinga-web installation found."
    exit 1
}

VERSION=`grep \<setting\ name=\"version.minor\"\> $ICINGA_XML | tr -dc [0-9]`
[ $VERSION -lt 5 ] && {
    echo "Icinga-web versions older than 1.5.0 are currently not supported."
    exit 1
}

[ $VERSION -lt 6 ] && {
    patch --dry-run $PREFIX/app/modules/Cronks/lib/template/CronkGridTemplateXmlParser.class.php icinga-web-1.5.x.patch > /dev/null
    [ $? -eq 0 ] && {
        patch $PREFIX/app/modules/Cronks/lib/template/CronkGridTemplateXmlParser.class.php icinga-web-1.5.x.patch
    } || {
        echo "WARNING: Unable to apply icinga-web patch. Continuing anyway."
    }
}

cp -r $DIR/inGraph $PREFIX/app/modules/

exit 0
