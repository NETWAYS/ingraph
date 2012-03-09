<?php

class inGraph_BackendModel extends inGraphBaseModel implements AgaviISingletonModel
{
    protected $client = null;

    public function initialize(AgaviContext $ctx, array $params = array())
    {
        parent::initialize($ctx, $params);
        $xmlRpcClient = new inGraph_XmlRpc_Client($params);
        $this->backend = new inGraph_Backend($xmlRpcClient);
    }

    public function fetchHosts($hostPattern = '%', $offset = 0, $limit = 20)
    {
        $hosts = $this->backend->fetchHosts($hostPattern, $limit, $offset);
        return array(
            'results' => $hosts['hosts'],
            'total' => $hosts['total']
        );
    }

    public function fetchServices($hostPattern = '%', $servicePattern = '%',
                                  $offset = 0, $limit = 20)
    {
        $services = $this->backend->fetchServices($hostPattern, $servicePattern,
                                                  $limit, $offset);
        $flat = array();
        foreach ($services['services'] as $service) {
            $flat[] = $service['service'];
        }

        return array(
            'results' => $flat,
            'total' => $services['total']
        );
    }

    public function fetchPlots($hostName, $serviceName = '') {
        return $this->backend->fetchPlots($hostName, $serviceName);
    }

    public function fetchValues($query, $start = null, $end = null,
                                $interval = null, $nullTolerance = 0)
    {
        return $this->backend->fetchValues($query, $start, $end, $interval,
                                           $nullTolerance);
    }

    public function createComment($host, $service, $time, $comment)
    {
        $author = $this->getContext()->getUser()->getNsmUser()->user_name;
        // parent_service = null
        return $this->backend->createComment($host, null, $service, $time,
                                             $author, $comment);
    }

    public function updateComment($id, $host, $service, $time, $comment) {
        $author = $this->getContext()->getUser()->getNsmUser()->user_name;
        // parent_service = null
        return $this->backend->updateComment($id, $host, null, $service, $time,
                                             $author, $comment);
    }

    public function deleteComment($id) {
        return $this->backend->deleteComment($id);
    }
}
