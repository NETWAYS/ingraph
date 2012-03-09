<?php

class inGraph_Provider_TemplateSuccessView extends inGraphBaseView
{
    public function executeJson(AgaviRequestDataHolder $rd)
    {
        return json_encode($this->getAttribute('template'));
    }
}
