<?php

class InGraph_Provider_ServicesSuccessView extends InGraphBaseView
{
	public function executeHtml(AgaviRequestDataHolder $rd)
	{
		$this->setupHtml($rd);

		$this->setAttribute('_title', 'Provider.Services');
	}
	
	public function executeJson(AgaviRequestDataHolder $rd) {
		return json_encode(array('LAOLA' => true));
	}
}

?>