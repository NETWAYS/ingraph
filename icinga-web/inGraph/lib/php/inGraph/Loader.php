<?php

/**
 * inGraph Autoloader
 *
 * Takes care of loading classes prefixed with <tt>inGraph_Loader::$prefix</tt>.
 *
 * Usage:
 * <code>
 * inGraph_Loader::register();
 * </code>
 *
 * @copyright Copyright (c) 2012 Netways GmbH <support@netways.de>
 * @author Eric Lippmann <eric.lippmann@netways.de>
 * @package inGraph
 * @license http://www.gnu.org/licenses/gpl-3.0.html GNU General Public License
 */
final class inGraph_Loader
{
    /**
     * Load classes with this prefix, defaults to <tt>inGraph</tt>
     *
     * @var string $prefix class prefix
     */
    public static $prefix = 'inGraph';

    /**
     * Load classes with this file suffix, defaults to <tt>.php</tt>
     *
     * @var string $suffix file suffix
     */
    public static $suffix = '.php';

    /**
     * Directory to search for classes, defaults to
     * <tt>parent directory of inGraph_Loader</tt>
     *
     * @var string $basedir Base directory
     */
    public static $basedir = null;

    /**
     * Autoloading
     *
     * @param string $class class name
     * @return bool true on success else false
     */
    public static function loadClass($class)
    {
        $parts = preg_split('/_/', $class);
        if ($parts[0] !== self::$prefix) {
            // Abort on wrong prefixes
            return false;
        }
        $file = self::$basedir . DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, $parts) . self::$suffix;
        if (@is_readable($file)) {
            require_once $file;
            return true;
        }
        return false;
    }

    /**
     * Register inGraph_Loader
     *
     * @return void
     */
    public static function register()
    {
        if (self::$basedir === null) {
            self::$basedir = realpath(dirname(dirname(__FILE__)));
        }
        set_include_path(implode(PATH_SEPARATOR, array(
            self::$basedir,
            get_include_path()
        )));
        spl_autoload_register(array('inGraph_Loader', 'loadClass'));
    }
}
