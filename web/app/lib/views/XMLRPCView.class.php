<?php 

class XMLRPCView extends _MVC_View {
	
    protected function ensureTypes($xy) {
        return array(intval($xy["x"])*1000, floatval($xy["y"]));
    }
    
    protected function sortX($a, $b) {
        return ($a["x"] == $b["x"]) ? 0 : (($a["x"] < $b["x"]) ? -1 : 1);
    }
    
    public function errorAjax($parameters) {
    	return json_encode(array(
    		'success' => false,
    		'results' => array(),
    		'message' => $this->getParameter('exception')->getMessage()
    	));
    }

}