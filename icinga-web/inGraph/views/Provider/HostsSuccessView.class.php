<?php

class inGraph_Provider_HostsSuccessView extends inGraphBaseView {
	public function executeJson(AgaviRequestDataHolder $rd) {
		$hosts = $this->getAttribute('hosts');
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