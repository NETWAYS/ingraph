#!/bin/bash
mysql -u root <<EOF
create database ingraph;
grant usage on *.* to 'ingraph'@'localhost' identified by 'ingraph';
grant all on ingraph.* to 'ingraph'@'localhost';
quit
EOF
