<?php

class Data_ServicesView extends _MVC_View {
    
    public function getAjax($parameters) {
        $services = $this->getParameter('services');
        
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