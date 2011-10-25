<?php

class _MVC_Exception extends Exception {
	
	public static function render(Exception $e) {
		$exitCode = 70;
		
		include _MVC_Config::get('mvc_dir') . DIRECTORY_SEPARATOR . 'templates' . DIRECTORY_SEPARATOR . 'exception.php';
		
		exit($exitCode);
	}
	
}