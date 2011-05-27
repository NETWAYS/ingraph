<?php 

class Template_ServiceAction extends _MVC_Action {
	
	public function executePost($paramters) {
		$templateDir = _MVC_Config::get('templates.dir');
		
		$templates = $this->scope->getModel('Templates', array(
			'dir' =>  realpath($templateDir) ? $templateDir : _MVC_Config::get('root_dir') . DIRECTORY_SEPARATOR . $templateDir,
			'default' => _MVC_Config::get('templates.default')
		));
		
		$this->setParameter('template', $templates->getTemplate($paramters->get('service')));
	}
	
}