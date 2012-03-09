<?php

class inGraph_Provider_ServicesSuccessView extends inGraphBaseView
{
    public function executeJson(AgaviRequestDataHolder $rd)
    {
        return $this->json_encode('services');
    }
}
