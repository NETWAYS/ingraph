<?php
/*
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This file is part of inGraph.
 *
 * inGraph is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * inGraph is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for mor
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * inGraph. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

class inGraph_Os_Process extends ArrayObject
{
    protected $resource;

    protected $pipes;

    protected $exitCode;

    public function __construct($args = array(),
                                $flags = ArrayObject::ARRAY_AS_PROPS,
                                $iteratorClass = 'ArrayIterator'
    ) {
        $defaults = array(
            // Cwd defaults to current PHP process' working dir
            'cwd' => null
        );
        parent::__construct(array_merge($defaults, $args), $flags,
                            $iteratorClass);
    }

    public function execute()
    {
        $pipes = $this->getPipes();
        $origRead = $read = array($pipes->stderr, $pipes->stdout);
        $write = null; // stdin not handled
        $except = null;
        $stdout = $stderr = '';
        stream_set_blocking($pipes->stdout, 0); // non-blocking
        stream_set_blocking($pipes->stderr, 0);
        while (false !== ($r = stream_select($read, $write, $except,
                                             null, 20000))
               && $this->getStatus()->running
        ) {
            foreach ($read as $pipe) {
                if ($pipe === $pipes->stdout) {
                    $stdout .= stream_get_contents($pipe);
                }
                if ($pipe === $pipes->stderr) {
                    $stderr .= stream_get_contents($pipe);
                }
            }
            // Reset pipes
            $read = $origRead;
        }
        return (object) array(
            'stdout' => $stdout,
            'stderr' => $stderr
        );
    }

    protected function getPipes()
    {
        if (null === $this->resource) {
            $descriptorspec = array(
                0 => array('pipe', 'r'), // stdin
                1 => array('pipe', 'w'), // stdout
                2 => array('pipe', 'w')  // stderr
            );
            $this->resource = proc_open(
                $this->cmd,
                $descriptorspec,
                $this->pipes,
                $this->cwd,
                // Environment defaults to current PHP process' environment
                null
            );
            if (!is_resource($this->resource)) {
                throw new Exception(sprintf(
                    'Cannot fork "%s"',
                    $this->cmd
                ));
            }
        }
        return (object) array(
            'stdin' => & $this->pipes[0],
            'stdout' => & $this->pipes[1],
            'stderr' => & $this->pipes[2]
        );
    }

    public function getStatus()
    {
        $status = (object) proc_get_status($this->resource);
        if (false === $status->running
            && null === $this->exitCode
        ) {
            // The exit code is only valid the first time proc_get_status is
            // called in terms of running false, hence we capture it
            $this->exitCode = $status->exitcode;
        }
        return $status;
    }

    public function close()
    {
        if (null === $this->resource){
            return 0;
        }
        $pipes = $this->getPipes();
        if (is_resource($pipes->stdin)) {
            fclose($pipes->stdin);
        }
        fclose($pipes->stdout);
        fclose($pipes->stderr);
        if (null === $this->exitCode) {
            $this->exitCode = proc_close($this->resource);
        }
        $this->resource = null;
        if (0 !== $this->exitCode) {
            throw new Exception(sprintf(
                'Running "%s" failed with exit code (%d)',
                $this->cmd,
                $this->exitCode
            ));
        }
        return $this->exitCode;
    }

    public function __destruct()
    {
        try {
            $this->close();
        } catch (Exception $e) {
            // TODO(el): Log
        }
    }
}
