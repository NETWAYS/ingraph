<?php

class inGraph_Provider_ViewsAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        $manager = new inGraph_View_Manager(
            AgaviConfig::get('modules.ingraph.views'));

        $this->setAttribute('views', array(
            'total' => $manager->getCount(),
            'results' => $manager->getViewNames(
                $rd->getParameter('start', 0),
                $rd->getParameter('limit', 20)
            )
        ));

        return $this->getDefaultViewName();
    }
}
