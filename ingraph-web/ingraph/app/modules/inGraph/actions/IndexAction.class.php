<?php

class inGraph_IndexAction extends inGraphBaseAction
{
    public function handleError(AgaviRequestDataHolder $rd)
    {
        return $this->getDefaultViewName();
    }
}
