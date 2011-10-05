<?php

final class _MVC_Util {
	
	public static function ucfirstr($str) {
		return ucfirst(strtolower($str));
	}
	
	public static function RegexRecursiveDirectoryIterator($dir, $re, $mode=RecursiveRegexIterator::MATCH) {
		return new RegexIterator(
			new RecursiveIteratorIterator(
				new RecursiveDirectoryIterator($dir)
			),
			$re,
			$mode
		);
	}
	
}