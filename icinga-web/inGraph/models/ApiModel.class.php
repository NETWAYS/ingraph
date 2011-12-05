<?php

class inGraph_ApiModel extends inGraphBaseModel implements AgaviISingletonModel {
    protected $client = null;

    public function initialize(AgaviContext $ctx, array $params = array()) {
        parent::initialize($ctx, $params);
        $this->client = $this->getContext()->getModel('XMLRPCClient',
                                                      'inGraph', $params);
    }
    
    /**
     * 
     * TODO(el): Cache content.
     */
    public function getPlots() {
        return $this->client->call('getPlots', func_get_args());
    }
   
    public function getValues() {
        return $this->client->call('getPlotValues2', func_get_args());
    }
    
    /**
     * 
     * TODO(el): Cache content.
     */
    public function getHosts() {
        return $this->client->call('getHostsFiltered', func_get_args());
    }
    
    /**
     * 
     * TODO(el): Cache content.
     */
    public function getServices() {
        return $this->client->call('getServices', func_get_args());
    }
    
    public function addComment() {
        return $this->client->call('addComment', func_get_args());
    }
    
    public function editComment() {
        return $this->client->call('updateComment', func_get_args());
    }
    
    public function deleteComment() {
        return $this->client->call('deleteComment', func_get_args());
    }
    
    public function getValuesDeprecated() {
        return $this->client->call('getPlotValues', func_get_args());
    }
}