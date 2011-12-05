#!/bin/sh
set -e

BASE=/ingraph
SCRIPT=`readlink -f $0`
DIR=`dirname $SCRIPT`
PREFIX=$DIR/inGraph

for ARG in $@
do
    case "$ARG" in
        -i)
            DEVEL=1
            ;;
        --prefix*)
            PREFIX=${ARG#--prefix}
            PREFIX=${PREFIX#=}
            [ -z "$PREFIX" ] && {
                echo "ERROR: expected an absolute directory name for --prefix"
                exit 1
            }
            ;;
        --base*)
            BASE=${ARG#--base}
            BASE=${BASE#=}
            [ -z "$BASE" ] && {
                echo "ERROR: expected a base"
                exit 1
            }
            ;;
        --help)
            echo "Installs inGraph web."
            echo
            echo "Usage: ./install.sh [OPTION]..."
            echo
            echo "Defaults for the options are specified in brackets."
            echo
            echo "--help              display this help and exit"
            echo "--prefix=PREFIX     install architecture-independent files in PREFIX"
            echo "                    [./inGraph]"
            echo "--base=BASE         rewrite base"
            echo "                    [ingraph]"
            exit 0
            ;;
        *)
            echo "WARNING: $ARG ignored"
            ;;
    esac
done

for F in `find $DIR -type f -name \*.in`
do
    C=${F%.in}
    cp $F $C
    sed -i -e s,@BASE@,$BASE, -e s,@PREFIX@,$PREFIX, $C
done

[ -z "$DEVEL" ] && {
    DIR=$DIR/inGraph
    for ID in `find $DIR -type d`
    do
        install -m 755 $ID -d $PREFIX/${ID##$DIR}
    done
    for IF in `find $DIR -type f ! -name \*.in`
    do
        install -m 644 $IF $PREFIX/${IF##$DIR}
    done
}
