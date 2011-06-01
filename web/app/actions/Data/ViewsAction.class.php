<?php 

class Data_ViewsAction extends _MVC_Action {
	
	public function executePost($paramters) {
		$viewDir = _MVC_Config::get('views.dir');
		
		$views = $this->scope->getModel('Views', array(
			'dir' =>  realpath($viewDir) ? $viewDir : _MVC_Config::get('root_dir') . DIRECTORY_SEPARATOR . $viewDir
		));
		
		$this->setParameter('views', $views->getViews());
	}
	
}