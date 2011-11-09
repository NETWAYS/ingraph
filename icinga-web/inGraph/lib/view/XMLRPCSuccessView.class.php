<?php 

class inGraph_XMLRPCSuccessView extends inGraphBaseView {
	
    protected function ensureTypes(&$xy) {
        $xy = array(
        	(int)$xy[0]*1000,
        	is_numeric($xy[1]) ? (float)$xy[1] : null
        );
    }
    
    protected function sortX($a, $b) {
        return ($a['x'] == $b['x']) ? 0 : (($a['x'] < $b['x']) ? -1 : 1);
    }
    
}