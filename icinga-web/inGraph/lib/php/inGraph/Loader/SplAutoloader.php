 <?php
 /**
  * SplAutoloader.php
  *
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
  * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
  * details.
  *
  * You should have received a copy of the GNU General Public License along with
  * inGraph. If not, see <http://www.gnu.org/licenses/gpl.html>.
  *
  * @link https://www.netways.org/projects/ingraph
  * @author Eric Lippmann <eric.lippmann@netways.de>
  * @copyright Copyright (c) 2012 NETWAYS GmbH (http.netways.de) <info@netways.de>
  * @license http://www.gnu.org/licenses/gpl-3.0.html GNU General Public License
  * @package inGraph_Loader
  */

final class inGraph_Loader_SplAutoloader
{
    protected static $instance;

    const SEPARATOR = '_';

    protected $prefixes = array();

    public static function getInstance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function registerPrefix($prefix, $directory)
    {
        $this->prefixes[$prefix] = $directory;
    }

    public function loadClass($class)
    {
        foreach ($this->prefixes as $prefix => $directory) {
            if (0 === strpos($class, $prefix)) {
                $filename = $directory
                    . str_replace(self::SEPARATOR, DIRECTORY_SEPARATOR,
                                  substr($class, strlen($prefix))) // Trim off prefix
                    . '.php';
                if (file_exists($filename)) {
                    return include $filename;
                }
                return false;
            }
        }
        return false;
    }

    public function autoload($class)
    {
        return $this->loadClass($class);
    }

    public function register()
    {
        $this->registerPrefix('inGraph', realpath(dirname(dirname(__FILE__))));
        spl_autoload_register(array($this, 'autoload'));
    }
}
