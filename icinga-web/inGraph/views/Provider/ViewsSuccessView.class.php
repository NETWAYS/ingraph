<?php

class inGraph_Provider_ViewsSuccessView extends inGraphBaseView {
	public function executeJson(AgaviRequestDataHolder $rd) {
	    return $this->json_encode('views');
	}
}