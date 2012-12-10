<?php

class inGraph_Provider_PlotsSuccessView extends inGraphBaseView
{
    public function executeJson(AgaviRequestDataHolder $rd)
    {
        return json_encode($this->getAttribute('plots'));
    }
}
