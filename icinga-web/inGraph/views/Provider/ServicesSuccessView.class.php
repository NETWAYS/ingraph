<?php

class inGraph_Provider_ServicesSuccessView extends inGraphBaseView
{
    public function executeJson(AgaviRequestDataHolder $rd)
    {
        return json_encode($this->getAttribute('services'));
    }
}
