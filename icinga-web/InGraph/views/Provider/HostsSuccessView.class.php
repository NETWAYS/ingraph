<?php

class InGraph_Provider_HostsSuccessView extends InGraphBaseView
{
	public function executeHtml(AgaviRequestDataHolder $rd)
	{
		$this->setupHtml($rd);

		$this->setAttribute('_title', 'Provider.Hosts');
	}
	
	public function executeJson(AgaviRequestDataHolder $rd) {
		
		$rpcClient = $this->getContext()->getModel('Provider.XMLRPCClient', 'InGraph', AgaviConfig::get('modules.ingraph.rpc'));
		
		$proxy = $this->getContext()->getModel('Provider.Proxy', 'InGraph', array('client' => $rpcClient));
		
		$hosts = $proxy->getHosts('*dns*');
		
		return json_encode(array('LAOLA' => true));
	}
}

?>