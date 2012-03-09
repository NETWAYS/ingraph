<?php

class inGraph_Cronk_ViewAction extends inGraphBaseAction
{
    public function handleError(AgaviRequestDataHolder $rd)
    {
        return $this->getDefaultViewName();
    }
}
