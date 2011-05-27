<?php 

class Data_HostsAction extends XMLRPCAction {
	
	public function executePost($parameters) {
		$this->setParameter('hosts', $this->getClient()->call(
			'getHostsFiltered',
			array(
				$parameters->get('host', '%'),
				$parameters->get('limit', 10),
				$parameters->get('offset', 0)
			)
		));
	}
	
}