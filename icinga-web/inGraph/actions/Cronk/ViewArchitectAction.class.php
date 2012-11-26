<?php

class inGraph_Cronk_ViewArchitectAction extends inGraphBaseAction
{
    public function handleError(AgaviRequestDataHolder $rd)
    {
        return $this->getDefaultViewName();
    }
}
