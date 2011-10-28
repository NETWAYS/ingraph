<?php 

class inGraph_XMLRPCAction extends IcingainGraphBaseAction {
	public function getClient() {
		return $this->getContext()->getModel(
			'XMLRPCClient',
			'inGraph',
			AgaviConfig::get('modules.ingraph.xmlrpc')
		);
	}
}