#!/bin/sh
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
