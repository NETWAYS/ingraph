<?php 

class inGraph_XMLRPCAction extends inGraphBaseAction {
	public function getClient() {
		return $this->getContext()->getModel(
			'XMLRPCClient',
			'inGraph',
			AgaviConfig::get('modules.ingraph.xmlrpc')
		);
	}
}