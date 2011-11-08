<?php

class inGraph_ApiModel extends AppKitBaseModel implements AgaviISingletonModel {
    protected $client = null;

    public function initialize(AgaviContext $ctx, array $params = array()) {
        parent::initialize($ctx, $params);
        $this->client = $this->getContext()->getModel('XMLRPCClient',
                                                      'inGraph', $params);
    }
    
    public function getPlots($host, $service) {
        return $this->client->call('getPlots', array($host, $service));
    }
}