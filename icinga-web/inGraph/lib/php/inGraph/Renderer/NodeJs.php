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

class inGraph_Renderer_NodeJs extends inGraph_Os_Process
{
    protected static $instance;

    public static function getInstance(array $args = array())
    {
        if (null === self::$instance) {
            self::$instance = new self($args);
        }
        return self::$instance;
    }

    public function input($data)
    {
        $pipes = $this->getPipes();
        fwrite($pipes->stdin, $data);
        fclose($pipes->stdin);
    }

    public function renderImage($args)
    {
        $this->input(json_encode($args));
        $process = $this->execute();
        $image = $process->stdout;
        $errors = $process->stderr;
        if (!self::isPng($image)) {
            throw new Exception($errors);
        }
        $this->close();
        return $image;
    }

    protected static function isPng($data)
    {
        $pngHeader = pack('H*', '89504E470D0A1A0A');
        if ($pngHeader === substr($data, 0, 8)) {
            return true;
        }
        return false;
    }
}
