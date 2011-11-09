<?php

class inGraph_Provider_ServicesSuccessView extends inGraphBaseView {
	public function executeJson(AgaviRequestDataHolder $rd) {
        $services = $this->getAttribute('services');
        $services['results'] = array();
        foreach($services['services'] as $service) {
            $services['results'][] = array(
                'service' => $service
            );
        }
        unset($services['services']);
        return json_encode($services);
	}
}