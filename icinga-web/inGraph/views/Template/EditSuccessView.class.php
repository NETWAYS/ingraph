<?php

class inGraph_Template_EditSuccessView extends IcingainGraphBaseView
{
	public function executeHtml(AgaviRequestDataHolder $rd)
	{
		$this->setupHtml($rd);
		
		$this->setAttribute('_title', 'Template.Edit');
	}
}

?>