<?php

class inGraph_Comments_UpdateAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        try {
            $this->getBackend()->updateComment(
                $rd->getParameter('id'),
                $rd->getParameter('host'),
                $rd->getParameter('service'),
                $rd->getParameter('timestamp'),
                $rd->getParameter('comment')
            );
        } catch(inGraph_XmlRpc_Exception $e) {
            return $this->setError($e->getMessage());
        }
        return $this->getDefaultViewName();
    }
}
