<?php

class InGraph_DisplaySuccessView extends InGraphBaseView
{
	public function executeHtml(AgaviRequestDataHolder $rd)
	{
		$this->setupHtml($rd);

		$this->setAttribute('_title', 'Display');
	}
}

?>