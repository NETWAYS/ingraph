#!/bin/sh

set -o nounset
set -e errexit

CACHEDIR={/home/elippmann/workspace/ingraph-web##/}/app/cache
RM_OPTS=${RM_OPTS-}

rm ${RM_OPTS} ${CAHDEIR}/* > /dev/null 2>&1

echo $?
echo