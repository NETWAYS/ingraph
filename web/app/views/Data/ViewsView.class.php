<?php

class Data_ViewsView extends _MVC_View {
    
    public function getAjax($parameters) {
        $views = $this->getParameter('views');
        
        $json = array();
        
        foreach($views as $view => $config) {
        	$json[] = array('view' => $view, 'config' => $config);
        }
        
        return json_encode(array(
        	'results' => $json,
        	'total' => count($json)
        ));
    }
    
}