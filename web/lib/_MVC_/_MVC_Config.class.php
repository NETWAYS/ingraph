<?php 

class _MVC_Config {
	
	protected static $config = array();
	
	public static function initialize() {
		$iterator = new RegexIterator(
			new RecursiveIteratorIterator(
				new RecursiveDirectoryIterator(self::get('config_dir'))
			),
			'/\.ini$/i',
			RecursiveRegexIterator::MATCH
		);
		
		foreach($iterator as $ini) {
			$config = self::concatKeys(parse_ini_file($ini, true));

			if($config) {
				self::readArray($config);
			}
		}
	}
	
	public static function set($key, $value, $overwrite=true) {
		$set = false;
		if(!array_key_exists($key, self::$config) || $overwrite) {
			self::$config[$key] = $value;
			$set = true;
		}
		return $set;
	}
	
	public static function get($key, $default=null) {
		return array_key_exists($key, self::$config) ? self::$config[$key] : $default;
	}
	
	private static function readArray(array $array=array()) {
		self::$config = array_merge(self::$config, $array);
	}
	
	private static function concatKeys($array) {
		$concat = array();
		
		foreach($array as $key => $value) {
			if(is_array($value)) {
				foreach($value as $vkey => $vvalue) {
					$concat["${key}.${vkey}"] = $vvalue;
				}
			} else {
				$concat[$key] = $value;
			}
		}
		
		return $concat;
	}
	
	
	
}