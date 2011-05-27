<?php 

require(dirname(dirname(__FILE__)) . '/lib/_MVC_/_MVC_Config.class.php');

require(dirname(dirname(__FILE__)) . '/lib/_MVC_/_MVC_.class.php');

_MVC_Config::set('root_dir', dirname(dirname(__FILE__)));

_MVC_::bootstrap();
_MVC_Config::initialize();

_MVC_Scope::getInstance()->getController()->dispatch();

exit(0);