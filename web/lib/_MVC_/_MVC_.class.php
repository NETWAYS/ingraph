<?php 

final class _MVC_ {
	
	protected static $autoloads = null;

	public static function __autoload($class) {
		if(self::$autoloads === null) {
			$classfiles = array();
			
			foreach(array(_MVC_Config::get('mvc_dir'), _MVC_Config::get('lib_dir'), _MVC_Config::get('models_dir')) as $dir) {
				$classfiles = array_merge(iterator_to_array(new RegexIterator(
					new RecursiveIteratorIterator(
						new RecursiveDirectoryIterator($dir)
					), '/([A-Za-z_]+).class.php$/i', RecursiveRegexIterator::GET_MATCH
				)), $classfiles);
			}
			
			foreach($classfiles as $classfile => $re) {
				self::$autoloads[$re[1]] = $classfile;
			}
		}
		
		if(isset(self::$autoloads[$class])) {
			require(self::$autoloads[$class]);
		} else {
			throw new _MVC_AutoloadException();
		}
	}
	
	public static function bootstrap() {
		_MVC_Config::set('app_dir', _MVC_Config::get('root_dir') . DIRECTORY_SEPARATOR . 'app');
		_MVC_Config::set('mvc_dir', _MVC_Config::get('root_dir') . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . '_MVC_');
		
		foreach(array('actions', 'config', 'lib', 'models', 'templates', 'views') as $sub) {
			_MVC_Config::set("${sub}_dir", _MVC_Config::get('app_dir') . DIRECTORY_SEPARATOR . $sub);
		}
		
		spl_autoload_register(array('_MVC_', '__autoload'));
	}
	
}