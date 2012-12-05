<?php

class inGraph_Provider_ValuesAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        $start = $start = $rd->getParameter('startx', null);
        $end = $rd->getParameter('endx', time());
//        if (($interval = $rd->getParameter('interval', null)) === null) {
//            if ($start !== null) {
//                $interval = $this->siftInterval($start, $end);
//            }
//        }
        $interval = $rd->getParameter('interval', null);
        $daemonConfig = AgaviConfig::get('modules.ingraph.daemon');
        try {
            $values = $this->getBackend()->fetchValues(
                json_decode($rd->getParameter('query'), true),
                $start,
                $end,
                $interval,
                (int) $rd->getParameter('nullTolerance',
                                        $daemonConfig['nullTolerance'])
            );
        } catch (inGraph_XmlRpc_Exception $e) {
            return $this->setError($e->getMessage());
        }
        $this->setAttribute('values', $values);
        return $this->getDefaultViewName();
    }
}
