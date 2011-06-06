<?php

class IndexView extends _MVC_View {
	
	public function getHtml($parameters) {
		$this->bottle->setParameter('_title', 'inGraph');
		$this->bottle->setParameter('host', $parameters->get('host', false));
	}
	
}