<?php

class inGraph_Comments_DeleteAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        try {
            $this->getBackend()->deleteComment(
                $rd->getParameter('id')
            );
        } catch(inGraph_XmlRpc_Exception $e) {
            return $this->setError($e->getMessage());
        }
        return $this->getDefaultViewName();
    }
}
