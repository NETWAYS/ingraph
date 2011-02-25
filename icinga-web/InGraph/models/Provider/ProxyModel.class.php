<?php

class InGraph_Provider_ProxyModel extends InGraphBaseModel {

	/**
	 * @var InGraph_Provider_XMLRPCCLientModel
	 */
	private $client = null;
	
	public function initialize(AgaviContext $context, array $parameters = array()) {
		parent::initialize($context, $parameters);
		
		if (!$parameters['client'] instanceof InGraph_Provider_XMLRPCClientModel) {
			throw new AgaviConfigurationException('Need a XMLRPCClient model there');
		}
		
		$this->client = $parameters['client'];
	}
	
	public function getHosts($query=null) {
		
		if ($query) {
			$query = str_replace('*', '%', $query);
		}
		else {
			$query = '%';
		}
		
		$parameters = array ($query, 0, 20);
		
		$data = $this->client->callMethod('getHostsFiltered', $parameters);
		
		var_dump($data['hosts']);
	}
	
}

?>