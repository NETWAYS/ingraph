<?php

class inGraph_Cronk_PortalAction extends inGraphBaseAction
{
    public function handleError(AgaviRequestDataHolder $rd)
    {
        return $this->getDefaultViewName();
    }
}
