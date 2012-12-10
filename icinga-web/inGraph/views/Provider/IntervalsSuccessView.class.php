<?php

class inGraph_Provider_IntervalsSuccessView extends inGraphBaseView
{
    public function executeJson(AgaviRequestDataHolder $rd)
    {
        return json_encode($this->getAttribute('intervals'));
    }
}
