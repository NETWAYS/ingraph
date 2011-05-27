<?php

class Template_ServiceView extends _MVC_View {
    
    public function getPhp($parameters) {
    	return $this->getParameter('template');
    }
    
}