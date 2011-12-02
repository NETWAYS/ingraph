<?php

class inGraph_Comments_DeleteAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        try {
            $this->getApi()->deleteComment($rd->getParameter('id'));
        } catch(XMLRPCClientException $e) {
            return $this->setError($e->getMessage());
        }
        return $this->getDefaultViewName();
    }
}