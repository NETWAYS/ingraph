<?php

class inGraph_ApiModel extends AppKitBaseModel implements AgaviISingletonModel {
    protected $client = null;

    public function initialize(AgaviContext $ctx, array $params = array()) {
        parent::initialize($ctx, $params);
        $this->client = $this->getContext()->getModel('XMLRPCClient',
                                                      'inGraph', $params);
    }
    
    public function getPlots() {
        return $this->client->call('getPlots', func_get_args());
    }
    
    public function getValues() {
        return $this->client->call('getPlotValues2', func_get_args());
    }
}