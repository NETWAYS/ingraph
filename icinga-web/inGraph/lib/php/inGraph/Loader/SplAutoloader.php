<?php

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
