<?php

class InGraph_Provider_TestSuccessView extends InGraphBaseView
{
	public function executeHtml(AgaviRequestDataHolder $rd)
	{
		$this->setupHtml($rd);

		$this->setAttribute('_title', 'Provider.Test');
	}
}

?>