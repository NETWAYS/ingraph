<?php
/**
 * Just a garbage class to run agavi
 * dispatch in class scope and prepare
 * paths.
 * 
 * @author mhein
 */
final class ClassicIngraphAgaviRunner {
	
	const AGAVI_ENV = 'production';
	const AGAVI_CONTEXT = 'web';
	
	/**
	 * Project base path
	 * @var string
	 */
	private static $pathRoot = null;
	
	/**
	 * Prepare environment and dispatch agavi request
	 */
	public static function runThrough() {
		if (self::$pathRoot === null) {
			self::$pathRoot = dirname(dirname(__FILE__));
		}
		
		require self::$pathRoot. '/libs/agavi/src/agavi.php';

		require self::$pathRoot. '/app/config.php';
	        AgaviConfig::set('core.skip_config_transformations', true);	
		Agavi::bootstrap(self::AGAVI_ENV);
		
		AgaviContext::getInstance(self::AGAVI_CONTEXT)->getController()->dispatch();
	}
}

ClassicIngraphAgaviRunner::runThrough();
?>
