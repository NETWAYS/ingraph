<?php 

class XMLRPCView extends _MVC_View {
	
    protected function ensureTypes(&$xy) {
        $xy = array(
        	(int)$xy[0]*1000,
        	is_numeric($xy[1]) ? (float)$xy[1] : null
        );
    }
    
    protected function sortX($a, $b) {
        return ($a['x'] == $b['x']) ? 0 : (($a['x'] < $b['x']) ? -1 : 1);
    }
    
    public function errorAjax($parameters) {
    	return json_encode(array(
    		'success' => false,
    		'results' => array(),
    		'message' => $this->getParameter('exception')->getMessage()
    	));
    }

}