<?php 

class Data_ServicesAction extends XMLRPCAction {
	
	public function executePost($parameters) {
		$this->setParameter('services', $this->getClient()->call(
			'getServices',
			array(
				$parameters->get('host'),
				$parameters->get('service', '%'),
				$parameters->get('limit', 10),
				$parameters->get('offset', 0)
			)
		));
	}
	
}