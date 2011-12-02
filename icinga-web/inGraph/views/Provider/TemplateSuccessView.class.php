<?php

class inGraph_Provider_TemplateSuccessView extends inGraphBaseView {
	public function executeJson(AgaviRequestDataHolder $rd) {
	    return json_encode(array(
	        'name' => $this->getAttribute('name'),
	        'content' => $this->getAttribute('template')));
	}
}