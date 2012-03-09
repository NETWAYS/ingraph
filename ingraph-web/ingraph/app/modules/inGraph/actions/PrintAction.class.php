<?php

class inGraph_PrintAction extends inGraphBaseAction
{
    public function handleError(AgaviRequestDataHolder $rd)
    {
        return $this->getDefaultViewName();
    }
}
