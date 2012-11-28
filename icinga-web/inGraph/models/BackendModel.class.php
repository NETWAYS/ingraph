<?php

class inGraph_BackendModel extends inGraphBaseModel implements AgaviISingletonModel
{
    protected $client = null;

    public function initialize(AgaviContext $ctx, array $params=array())
    {
        parent::initialize($ctx, $params);
        $xmlRpcClient = new inGraph_XmlRpc_Client($params);
        $this->backend = new inGraph_Backend($xmlRpcClient);
    }

    protected function icinga_fetchHosts($hostPattern)
    {
        $api = $this->getContext()->getModel('Store.LegacyLayer.IcingaApi',
                                             'Api');
        $search = $api
            ->createSearch()
            ->setSearchTarget(IcingaApiConstants::TARGET_HOST)
            ->setResultColumns(array('HOST_NAME'))
            ->setSearchFilter('HOST_NAME', $hostPattern,
                              IcingaApiConstants::MATCH_LIKE)
            ->setResultType(IcingaApiConstants::RESULT_ARRAY);
        IcingaPrincipalTargetTool::applyApiSecurityPrincipals($search);
        $permittedHosts = $api->fetch()->getAll();

        $i = new RecursiveIteratorIterator(
            new RecursiveArrayIterator($permittedHosts));
        $permittedHosts = iterator_to_array($i, false);
        return $permittedHosts;
    }

    public function fetchHosts($hostPattern='%', $offset=0, $limit=20)
    {
        $permittedHosts = $this->icinga_fetchHosts($hostPattern);
        $availableHosts = $this->backend->fetchHosts($hostPattern);
        $hosts = array_intersect($permittedHosts, $availableHosts['hosts']);
        $total = count($hosts);
        return array(
            'results' => array_slice($hosts, $offset, $limit),
            'total' => $total
        );
    }

    protected function icinga_fetchServices($hostPattern, $servicePattern)
    {
        $api = $this->getContext()->getModel('Store.LegacyLayer.IcingaApi',
                                             'Api');
        $search = $api
            ->createSearch()
            ->setSearchTarget(IcingaApiConstants::TARGET_SERVICE)
            ->setResultColumns(array('SERVICE_NAME'))
            ->setSearchFilter('HOST_NAME', $hostPattern,
                              IcingaApiConstants::MATCH_LIKE)
            ->setSearchFilter('SERVICE_NAME', $servicePattern,
                              IcingaApiConstants::MATCH_LIKE)
            ->setResultType(IcingaApiConstants::RESULT_ARRAY);
        IcingaPrincipalTargetTool::applyApiSecurityPrincipals($search);
        $permittedServices = $api->fetch()->getAll();

        $i = new RecursiveIteratorIterator(
            new RecursiveArrayIterator($permittedServices));
        $permittedServices = iterator_to_array($i, false);
        return $permittedServices;
    }

    public function fetchServices($hostPattern='%', $servicePattern='%',
                                  $offset=0, $limit=20)
    {
        $permittedServices = $this->icinga_fetchServices($hostPattern,
                                                         $servicePattern);
        $availableServices = $this->backend->fetchServices($hostPattern,
                                                           $servicePattern);
        $services = array();
        foreach ($availableServices['services'] as $service) {
            if ($service['parent_service'] !== null
                && (in_array($service['parent_service'], $permittedServices)
                    || in_array($service['service'], $permittedServices))
            ) {
                $services[] = array(
                    'name' => $service['parent_service'] . ' - '
                        . $service['service'],
                    'service' => $service['service'],
                    'parentService' => $service['parent_service']
                );
            } elseif (in_array($service['service'], $permittedServices)) {
                $services[] = array(
                    'name' => $service['service'],
                    'service' => $service['service']
                );
            }
        }
        $total = count($services);
        return array(
            'results' => array_slice($services, $offset, $limit),
            'total' => $total
        );
    }

    public function fetchPlots($hostName='%', $serviceName='',
                               $parentServiceName=null, $plotName=null,
                               $offset=0, $limit=20
    ) {
        // TODO(el): Security
        return $this->backend->fetchPlots($hostName, $serviceName,
                                          $parentServiceName, $plotName,
                                          $offset, $limit);
    }

    public function fetchValues($query, $start=null, $end=null,
                                $interval=null, $nullTolerance=0)
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
    
    public function fetchIntervals()
    {
        $intervals = $this->backend->fetchIntervals();
        return array(
            'total' => count($intervals),
            'results' => array_merge(array(), $intervals)
        );
    }
}
