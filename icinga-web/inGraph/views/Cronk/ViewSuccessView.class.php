<?php

class inGraph_Cronk_ViewSuccessView extends IcingainGraphBaseView {
	
	public function executeHtml(AgaviRequestDataHolder $rd) {
		$this->setupHtml($rd);
		
		$this->setAttribute('_title', 'Cronk.View');
	}
	
}