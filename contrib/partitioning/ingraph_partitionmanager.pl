#!/usr/bin/perl
#
# inGraph partition manager
#
# (c) 2013 NETWAYS GmbH
# Markus Frosch <markus.frosch@netways.de>
#
#--[ CHANGELOG ]----------------------------------------------------------------
#
# 2013-06-21 Bugfix for Partition dropping
# 2013-06-20 Initial version
#
#--[ LICENSE ]------------------------------------------------------------------
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

#--[ CONFIG ]-------------------------------------------------------------------

my $DBNAME = "ingraph";
my $DBDSN  = "DBI:mysql:database=$DBNAME";
#my $DBDSN  = "DBI:mysql:database=$DBNAME;mysql_socket=/path/to/mysqld.sock";
my $DBUSER = "ingraph";
my $DBPASS = "changeme";

my $PARTITIONS = {
    # these are based on the defaults of inGraph make sure to adjust
    # the values to match your set aggregates, and the respective
    # retention period (classic retention should be disabled!)
    1*60 => {
        partition => "days",
        keep      => 2,
        advance   => 2,
    },
    5*60 => {
        partition => "days",
        keep      => 10,
        advance   => 10,
    },
    30*60 => {
        partition => "weeks",
        keep      => 9,
        advance   => 2,
    },
    6*60*60 => {
        partition => "months",
        keep      => 5*12,
        advance   => 2,
    },
};

#--[ HELP ]----------------------------------------------------------------{{{1-

=head1 NAME

ingraph_partitionmanager.pl - manager database partitions for inGraph

=head1 SYNOPSIS

ingraph_partitionmanager.pl [-h] [-q] [-d] [-n]

=head1 OPTIONS

=over

=item -h|--help

prints this help

=item -d|--debug

prints debug messages while running

=item -q|--quiet

does not print verbose output while running

=item -n|--dryrun

don't do anything, but print out what would be done

=item --today=YYYY-MM-DD

work with an other date for today calculations

usefull for testing and simulation

=item --no-drop

don't drop any partitions

=cut

#--[ GLOBAL ]--------------------------------------------------------------{{{1-
#
# these are internal values and includes
# only change this if you really know what you are doing!
#

use strict;
use DBI;
use Getopt::Long qw(:config no_ignore_case bundling);
use Pod::Usage;
use POSIX qw(strftime);
use Date::Calc qw(:all);

my $PARTITION_TYPES = {
    days => {
        pattern => "p2[0-9]{3}(?:0[1-9]|1[0-2])(?:0[1-9]|[1-2][0-9]|3[0-1])",
    },
    weeks => {
        pattern => "p2[0-9]{3}W(?:0[1-9]|[1-4][0-9]|5[0-3])",
    },
    months => {
        pattern => "p2[0-9]{3}(?:0[1-9]|1[0-2])",
    },
};

my $VERSION = "0.99.20130621";
my $DBI;
my $VERBOSE = 1;
my $DEBUG = 0;
my $DRYRUN = 0;
my $NODROP = 0;
my @TODAY = Today(1);
my $IGNORETODAYDRYRUN;
my $opt;
# 1}}}

#--[ FUNCTIONS ]-----------------------------------------------------------{{{1-

# helper functions {{{2
sub ourtimestamp() {
    return strftime("%Y-%m-%d %H:%M:%S", localtime);
}

sub Debugging {
    return if ! $DEBUG;
    my $message = shift;
    my $ts = ourtimestamp();
    $message =~ s/\n/\n                            /g;
    printf "[$ts] DEBUG $message\n", @_;
}

sub beVerbose {
    return if ! $VERBOSE;
    my $message = shift;
    my $ts = ourtimestamp();
    $message =~ s/\n/\n                              /g;
    printf "[$ts] VERBOSE $message\n", @_;
}

sub throwdryrunwarning {
    return throwwarning("DRYRUN: ".shift, @_);
}

sub throwwarning {
    my $message = shift;
    my $ts = ourtimestamp();
    $message =~ s/\n/\n                              /g;
    printf "[$ts] WARNING $message\n", @_;
}

sub throwerror {
    my $message = shift;
    my $ts = ourtimestamp();
    $message =~ s/\n/\n                            /g;
    printf "[$ts] ERROR $message\n", @_;
    exit(1);
}

sub usage() {
    my $message = shift;
    print "$message\n\n" if ($message);
    pod2usage();
}

sub connect_database() {
    if (!$DBI) {
        $DBI = DBI->connect($DBDSN, $DBUSER, $DBPASS) or die "Unable to connect: $DBI::errstr\n";
    }
}
# }}}

sub options() { #{{{2
    # read commandline config
    my $result = GetOptions(
        "d|debug"    => \$DEBUG,
        "n|dryrun"   => \$DRYRUN,
        "q|quiet"    => \$opt->{quiet},
        "h|help"     => \$opt->{help},
        "V|version"  => \$opt->{version},
        "today:s"    => \$opt->{today},
        "no-drop"    => \$NODROP,
        "ignore-today-dry-run" => \$IGNORETODAYDRYRUN # ONLY IF YOU KNOW WHAT YOU DO!!!!
    );
    if (!$result) {
        usage();
    }
    if (defined $opt->{version}) {
        print "ingraph_partitionmanager.pl ".$VERSION."\n";
        exit 0;
    }

    if (defined $opt->{help}) {
        pod2usage(1);
        exit 0;
    }

    if (defined $opt->{quiet} and !$DEBUG) {
        $VERBOSE = 0;
    }
    if ($DEBUG == 1) {
        $VERBOSE = 1;
    }

    if (defined $opt->{today}) {
        if ($opt->{today} =~ m/^(2[0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/) {
            @TODAY = ($1, $2, $3);
            if (!$IGNORETODAYDRYRUN) {
                throwwarning("setting a date for today forces DRYRUN and VERBOSE mode!");
                $DRYRUN = 1;
                $VERBOSE = 1;
            }
        }
        else {
            throwerror("illegal date for today: ".$opt->{today}.", needs format YYYY-MM-DD!");
        }
    }
} #2}}}

sub validate_timeframes() { #{{{2
    beVerbose("valdation partition settings against timeframes...");
    # retrieve timeframes from database
    my $query = "SELECT id, `interval`, retention_period, active FROM timeframe";

    Debugging("running query: $query");
    my $timeframes = $DBI->selectall_hashref($query, 'interval') or throwerror("could not get timeframes: $! (query: $query)");

    my @intervals = keys %$timeframes;
    foreach (@intervals) {
        my $interval = $_;
        my $timeframe = $timeframes->{$interval};

        if (! defined $PARTITIONS->{$interval}) {
            if ($timeframe->{active} != 0 and $timeframe->{active} ne "0") {
                throwwarning("timeframe '$interval' NOT configured but active in database!");
                next;
            }
            else {
                # we don't care about this timeframe
                Debugging("ignoring disabled old timeframe '$interval'");
                next;
            }
        }
        else {
            my $settings = $PARTITIONS->{$interval};

            if ($timeframe->{active} != 1 and $timeframe->{active} ne "1") {
                throwwarning("timeframe '$interval' configured but NOT active in database!");
            }
            if ($timeframe->{retention_period} ne '' and defined $timeframe->{retention_period}) {
                throwwarning("timeframe '$interval' has enabled retention! (retention_period=%d)", $timeframe->{retention_period});
            }

            Debugging("timeframe '$interval' is OK!");
        }
    }

    # check the rest of the configured timeframes
    foreach (keys %$PARTITIONS) {
        my $interval = $_;
        next if (defined $timeframes->{$interval});
        throwwarning("timeframe '$interval' configured, but NOT does not exist in database!");
    }
} #2}}}

sub get_tables() { #{{{2
    Debugging("querying tables...");
    # retrieve tables from database
    my $tables = $DBI->selectcol_arrayref("SHOW TABLES") or throwerror("could not get tables: $!");

    if (! grep /^datapoint$/, @$tables) {
        throwerror("table datapoint is missing, is this a inGraph database?");
    }

    # only return datapoint partitions
    my @dp = grep /^datapoint_/, @$tables;
    return \@dp;
} #}}}

# partition calculation {{{2
sub calculate_required_partitions($) {
    my $interval  = shift;
    my $timeframe = $PARTITIONS->{$interval};

    Debugging("calculating partitions timeframe $interval...");
    my $parttype = $timeframe->{partition};

    my $partitions;
    if ($parttype eq "months") {
        $partitions = _crp_months($interval);
    }
    elsif ($parttype eq "weeks") {
        $partitions = _crp_weeks($interval);
    }
    elsif ($parttype eq "days") {
        $partitions = _crp_days($interval);
    }
    else {
        throwerror("partitiontype '$parttype' not implemented!");
    }

    return $partitions;
}

sub _get_part_sql($$) {
    my ($name, $ts) = @_;
    return "PARTITION $name VALUES LESS THAN ($ts)";
}

sub _crp_months($) {
    my $interval = shift;
    my $data = $PARTITIONS->{$interval};

    my $partitions = {};

    Debugging("calculating monthly partitions for $interval...");

    my $keep = $data->{keep};
    throwerror("missing 'keep' setting for partition $interval!") if ! $keep;
    my $advance = $data->{advance};
    throwerror("missing 'advance' setting for partition $interval!") if ! $advance;

    for (my $i = -$keep; $i <= $advance; $i++) {
        # calculate year-month with the offset
        my ($year, $month) = @TODAY;
        ($year, $month) = Add_Delta_YM($year, $month, 1, 0, $i);

        my $name = sprintf("p%.4d%.2d", $year, $month);

        # timestamp of next month
        my ($nyear, $nmonth, $nday) = Add_Delta_YM($year, $month, 1, 0, 1);
        my $timestamp = Date_to_Time($nyear, $nmonth, $nday,0,0,0);
        my $sql = _get_part_sql($name, $timestamp);

        Debugging("Partition with offset %4s is %s %s - SQL: %s - data until: %s", $i, $name, $timestamp, $sql, Date_to_Text($nyear, $nmonth, $nday));

        # add partition to stack
        $partitions->{$name} = {
            name => $name,
            timestamp => $timestamp,
            sql => $sql,
            offset => $i,
        };
    }

    return $partitions;
}

sub _crp_weeks($) {
    my $interval = shift;
    my $data = $PARTITIONS->{$interval};

    my $partitions = {};

    Debugging("calculating weekly partitions for $interval...");

    my $keep = $data->{keep};
    throwerror("missing 'keep' setting for partition $interval!") if ! $keep;
    my $advance = $data->{advance};
    throwerror("missing 'advance' setting for partition $interval!") if ! $advance;

    for (my $i = -$keep; $i <= $advance; $i++) {
        # calculate monday of current week
        my ($year, $month, $day) = @TODAY;
        ($year, $month, $day) = Monday_of_Week(Week_of_Year($year, $month, $day));

        # offset week
        ($year, $month, $day) = Add_Delta_Days($year, $month, $day, $i*7);

        # get week/year for that offset
        my ($week, $wyear) = Week_of_Year($year, $month, $day);

        my $name = sprintf("p%.4dW%.2d", $wyear, $week);

        # timestamp of next week
        my ($nyear, $nmonth, $nday) = Add_Delta_Days($year, $month, $day, 7);
        my $timestamp = Date_to_Time($nyear, $nmonth, $nday,0,0,0);
        my $sql = _get_part_sql($name, $timestamp);

        Debugging("Partition with offset %4s is %s %s - SQL: %s - data until: %s", $i, $name, $timestamp, $sql, Date_to_Text($nyear, $nmonth, $nday));

        # add partition to stack
        $partitions->{$name} = {
            name => $name,
            timestamp => $timestamp,
            sql => $sql,
            offset => $i,
        };
    }

    return $partitions;
}

sub _crp_days($) {
    my $interval = shift;
    my $data = $PARTITIONS->{$interval};

    my $partitions = {};

    Debugging("calculating daily partitions for $interval...");

    my $keep = $data->{keep};
    throwerror("missing 'keep' setting for partition $interval!") if ! $keep;
    my $advance = $data->{advance};
    throwerror("missing 'advance' setting for partition $interval!") if ! $advance;

    for (my $i = -$keep; $i <= $advance; $i++) {
        # calculate year-month with the offset
        my ($year, $month, $day) = @TODAY;
        ($year, $month, $day) = Add_Delta_YMD($year, $month, $day, 0, 0, $i);

        my $name = sprintf("p%.4d%.2d%.2d", $year, $month, $day);

        # timestamp of next day
        my ($nyear, $nmonth, $nday) = Add_Delta_YMD($year, $month, $day, 0, 0, 1);
        my $timestamp = Date_to_Time($nyear, $nmonth, $nday,0,0,0);
        my $sql = _get_part_sql($name, $timestamp);

        Debugging("Partition with offset %4s is %s %s - SQL: %s - data until: %s", $i, $name, $timestamp, $sql, Date_to_Text($nyear, $nmonth, $nday));

        # add partition to stack
        $partitions->{$name} = {
            name => $name,
            timestamp => $timestamp,
            sql => $sql,
            offset => $i,
        };
    }

    return $partitions;
}
# partition calculation 2}}}

sub create_table($) { #{{{2
    my $interval = shift;
    my $timeframe = $PARTITIONS->{$interval};

    my $table = "datapoint_$interval";
    my $query = "CREATE TABLE `$table` LIKE `datapoint`";

    Debugging("preparing to create table '$table'...");

    my $partitions = calculate_required_partitions($interval);

    if (! defined $partitions or scalar keys %$partitions == 0) {
        throwerror("no partitions calculated for table '$table'!");
    }

    my $alterquery = "ALTER TABLE `$table`\n";
    $alterquery   .= "DROP COLUMN `timeframe_id`, "; # we don't use that column in partitioned tabled
    $alterquery   .= "DROP INDEX `idx_dp_2` "; # drop that (now) duplicated index
    $alterquery   .= "PARTITION BY RANGE (`timestamp`) (";

    my $first = 1;
    foreach (sort keys %$partitions) {
        my $partition = $partitions->{$_};
        if ($first != 1) {
            $alterquery .= ",";
        }
        else {
            $first = 0;
        }
        $alterquery .= "\n  ".$partition->{sql};
    }
    $alterquery .= "\n)";

    Debugging("create table query:\n$query");
    Debugging("alter table query:\n$alterquery");
    if ($DRYRUN) {
        throwdryrunwarning("would create table '$table'");
        throwdryrunwarning("would apply partition on table '$table'");
    }
    else {
        beVerbose("creating table '$table'");
        $DBI->do($query) or throwerror("could not create table '$table': $!\n$query");

        beVerbose("applying partition on table '$table'");
        $DBI->do($alterquery) or throwerror("could not apply partitions on table '$table': $!\n$alterquery");
    }
} #2}}}

# partition validation {{{2
sub maintain_partitions($) {
    my $interval = shift;

    my $timeframe = $PARTITIONS->{$interval};
    my $table = "datapoint_$interval";

    beVerbose("maintaining partitions for table '$table'...");

    my $current_partitions = get_existing_partitions($table, $timeframe->{partition});
    my $required_partitions = calculate_required_partitions($interval);

    my @idx_current = sort keys %$current_partitions;
    Debugging("current partitions: ". join ", ", @idx_current);
    my @idx_required = sort keys %$required_partitions;
    Debugging("required partitions: ". join ", ", @idx_required);

    my $newest_current_partition = $idx_current[$#idx_current];
    my $oldest_required_partition = $idx_required[0];

    # what partitions do we need to create?
    my $add_partitions = {};
    my $query_add = "ALTER TABLE `$table` ADD PARTITION (";

    foreach (@idx_required) {
        my $name = $_;
        my $partition = $required_partitions->{$name};

        if (!defined $current_partitions->{$name}) {
            # check if it would be a older partition than the existing ones?
            if ($newest_current_partition gt $name) {
                throwwarning("can't create partition '$name' because its older than the newest partition '$newest_current_partition'!");
            }
            else {
                $add_partitions->{$name} = $partition;
                $query_add .= "\n  ".$partition->{sql}.",";
            }
        }
    }
    $query_add =~ s/,$/\n)/;

    if (scalar keys %$add_partitions > 0) {
        beVerbose("need to create the following partitions for timeframe '$interval': ". join ", ", sort keys %$add_partitions);
        Debugging("would run query: $query_add");

        if ($DRYRUN) {
            throwdryrunwarning("not executing add");
        }
        else {
            $DBI->do($query_add) or throwerror("could not create partitions in table '$table': $!\n$query_add");
        }
    }
    else {
        beVerbose("no partitions to add.");
    }

    # what partitions do we need to drop?
    my $drop_partitions = {};

    foreach (@idx_current) {
        my $name = $_;
        my $partition = $current_partitions->{$name};

        if (!defined $required_partitions->{$name}) {
            # only drop partitions that are older than the oldest required partition
            if ($name lt $oldest_required_partition) {
                $drop_partitions->{$name} = $partition;
            }
        }
    }

    if (scalar keys %$drop_partitions > 0) {
        beVerbose("need to drop the following partitions: ". join ", ", sort keys %$drop_partitions);
        my $query_drop = "ALTER TABLE `$table` DROP PARTITION ";
        $query_drop   .= "`".join("`, `",sort keys %$drop_partitions)."`";
        Debugging("would run query: $query_drop");

        if ($DRYRUN or $NODROP) {
            throwdryrunwarning("not executing drop");
        }
        else {
            $DBI->do($query_drop) or throwerror("could not drop partitions in table '$table': $!\n$query_drop");
        }
    }
    else {
        beVerbose("no partitions to drop.");
    }
}

sub get_existing_partitions($$) {
    my $table = shift;
    my $type = shift;

    my $pattern = $PARTITION_TYPES->{$type}->{pattern};

    my @fields = (
    );
    my $query = "SELECT ".
        'PARTITION_NAME AS `name`, '.
        'PARTITION_DESCRIPTION AS `timestamp` '.
        " FROM information_schema.partitions WHERE table_schema = '$DBNAME' and table_name = '$table'";

    Debugging("running partition info query: $query");
    my $result = $DBI->selectall_hashref($query, 'name') or throwerror("could not get partition info for table '$table': $!");

    # detecting type
    if ($pattern) {
        Debugging("validating partition names against pattern...");
        foreach (keys %$result) {
            my $partname = $_;
            if ($partname !~ m/^$pattern$/) {
                throwerror("partition '$partname' of table '$table' does not match the configured partitiontype '$type'! (pattern: $pattern)");
            }
        }
    }

    return $result;
}
# partition validation 2}}}

sub main() {
    options();
    connect_database();

    my $tables = get_tables();
    validate_timeframes();

    foreach (keys %{$PARTITIONS}) {
        my $interval = $_;

        # do we have a table yet?
        if (! grep /^datapoint_$interval$/, @$tables) {
            create_table($interval);
        }
        else {
            maintain_partitions($interval);
        }
    }
}

# }}}

main;

# vi: ts=4 sw=4 expandtab autoindent smarttab fdm=marker :
