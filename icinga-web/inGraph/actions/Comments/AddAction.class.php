<?php

class inGraph_Comments_AddAction extends inGraphBaseAction {
    public function executeWrite(AgaviRequestDataHolder $rd) {
        $author = $this->getContext()->getUser()->getNsmUser()->user_name;
        try {
            $this->getApi()->addComment($rd->getParameter('host'), null,
                                        $rd->getParameter('service'),
                                        $rd->getParameter('timestamp'),
                                        $author,
                                        $rd->getParameter('comment'));
        } catch(XMLRPCClientException $e) {
            return $this->setError($e->getMessage());
        }
        return $this->getDefaultViewName();
    }
}