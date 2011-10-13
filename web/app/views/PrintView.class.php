<?php

class PrintView extends _MVC_View {
    
    public function getHtml($parameters) {
        $this->bottle->setParameter('_title', 'inGraph');
        $this->bottle->setParameter('host', $parameters->get('host', ''));
        $this->bottle->setParameter('service', $parameters->get('service', ''));
        $this->bottle->setParameter('start', $parameters->get('start', false));
        $this->bottle->setParameter('end', $parameters->get('end', false));
        $this->bottle->setParameter('width', $parameters->get('width', 670));
        $this->bottle->setParameter('height', $parameters->get('height', 170));
    }
    
}