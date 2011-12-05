<?php

class inGraph_Provider_ViewSuccessView extends inGraphBaseView {
    public function executeJson(AgaviRequestDataHolder $rd) {
        return json_encode(array(
            'name' => $rd->getParameter('view'),
            'content' => $this->getAttribute('template')
        ));
    }
}