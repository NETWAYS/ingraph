<?php

class inGraph_Provider_HostsSuccessView extends inGraphBaseView {
	public function executeJson(AgaviRequestDataHolder $rd) {
	    return $this->json_encode('hosts');
	}
}