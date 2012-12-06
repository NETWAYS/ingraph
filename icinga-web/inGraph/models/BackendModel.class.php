<?php
/**
 * Copyright (C) 2012 NETWAYS GmbH, http://netways.de
 *
 * This file is part of inGraph.
 *
 * inGraph is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * inGraph is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * inGraph. If not, see <http://www.gnu.org/licenses/gpl.html>.
 *
 * @link https://www.netways.org/projects/ingraph
 * @author Eric Lippmann <eric.lippmann@netways.de>
 * @copyright Copyright (c) 2012 NETWAYS GmbH (http.netways.de) <info@netways.de>
 * @license http://www.gnu.org/licenses/gpl-3.0.html GNU General Public License
 * @package inGraph
 */

class inGraph_BackendModel extends inGraphBaseModel implements AgaviISingletonModel
{
    protected $client;

    public function initialize(AgaviContext $ctx, array $params = array())
    {
        parent::initialize($ctx, $params);
        $this->client = new inGraph_Daemon_Client($params);
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

    public function fetchHosts($hostPattern = '%', $offset = 0, $limit = 20)
    {
        $permittedHosts = $this->icinga_fetchHosts($hostPattern);
        $availableHosts = $this->client->fetchHosts($hostPattern);
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

    public function fetchServices($hostPattern = '%', $servicePattern = '%',
                                  $offset = 0, $limit = 20)
    {
        $permittedServices = $this->icinga_fetchServices($hostPattern,
                                                         $servicePattern);
        $availableServices = $this->client->fetchServices($hostPattern,
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

    public function fetchPlots($hostName, $serviceName = '',
                               $parentService = null
    ) {
        return $this->client->fetchPlots($hostName, $serviceName,
                                          $parentService);
    }

    public function fetchValues($query, $start = null, $end = null,
                                $interval = null, $nullTolerance = 0)
    {
        return $this->client->fetchValues($query, $start, $end, $interval,
                                           $nullTolerance);
    }

    public function createComment($host, $service, $time, $comment)
    {
        $author = $this->getContext()->getUser()->getNsmUser()->user_name;
        // parent_service = null
        return $this->client->createComment($host, null, $service, $time,
                                             $author, $comment);
    }

    public function updateComment($id, $host, $service, $time, $comment) {
        $author = $this->getContext()->getUser()->getNsmUser()->user_name;
        // parent_service = null
        return $this->client->updateComment($id, $host, null, $service, $time,
                                             $author, $comment);
    }

    public function deleteComment($id) {
        return $this->client->deleteComment($id);
    }
}
