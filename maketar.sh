#!/bin/bash
###
# Make a tarball
# (c) 2012 NETWAYS GmbH
# by Markus Frosch <markus.frosch@netways.de>
###

set -e

name="inGraph"
gitbranch=`git branch --no-color 2> /dev/null | sed -e '/^[^*]/d' -e 's/^\* //' -e 's/\//_/g' -e 's/[^A-Za-z0-9\-\_]//g'`
githash=`git log --no-color -n 1 | head -n 1 | sed -e 's/^commit //' | head -c 8`

if [ "$1" != "" ]; then
    prefix="inGraph-$1"
else
    if [ "$gitbranch" = "master" ]; then
        prefix="$name-$githash"
    else
        prefix="$name-$gitbranch-$githash"
    fi
fi
filename="$prefix.tar.gz"

echo "creating tarball ../$filename.tar.gz ..."

if [ -f "../$filename" ]; then
    echo "file ../$filename already exists!" >&2
    exit 1
fi

# pack initial package
git archive --worktree-attributes --output="../$filename" --prefix="$prefix/" HEAD

echo "done."

