<?php

class Data_HostsView extends XMLRPCView {
	
	public function getAjax($parameters) {
		$hosts = $this->getParameter('hosts');
		
		$hosts['results'] = array();
		foreach($hosts['hosts'] as $host) {
			$hosts['results'][] = array(
				'host' => $host
			);
		}
		
		unset($hosts['hosts']);
		
		return json_encode($hosts);
	}
	
}