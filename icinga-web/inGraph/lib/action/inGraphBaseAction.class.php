<?php

class inGraphBaseAction extends IcingaBaseAction
{
    protected $requires_auth = false;
    protected $credentials = array('icinga.user');
    protected $backend = null;

    public function isSecure()
    {
        return $this->requires_auth;
    }

    public function getCredentials()
    {
        return $this->credentials;
    }

    public function getDefaultViewName()
    {
        return 'Success';
    }

    public function executeRead(AgaviRequestDataHolder $rd)
    {
        return $this->getDefaultViewName();
    }

    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        return $this->getDefaultViewName();
    }

    public function setError($err)
    {
        $this->setAttribute('errorMessage', $err);
        return 'Error';
    }

    public function handleError(AgaviRequestDataHolder $rd)
    {
        $m = $this->getAttribute('errorMessage', false);
        if($m === false) {
            $m = array();
            foreach($this->container->getValidationManager()
                         ->getReport()->getErrorMessages() as $e)
            {
                $m[] = $e;
            }
            $m = implode(' ', $m);
        }
        $this->setAttribute('errorMessage', $m);
        return 'Error';
    }

    public function getBackend()
    {
        if($this->backend === null) {
            $this->backend = $this->getContext()->getModel(
                'Backend', 'inGraph',
                AgaviConfig::get('modules.ingraph.xmlrpc')
            );
        }
        return $this->backend;
    }

    /**
     *
     * @author Thomas Gelf <thomas.gelf@netways.de>
     */
    protected function siftInterval($start, $end)
    {
        $range = $end - $start;
        if ($range <= 60 * 60 * 2) {
            $interval = 60;
        } elseif ($range <= 60 * 60 * 24) {
            $interval = 60 * 5;
        } elseif ($range <= 60 * 60 * 24 * 14) {
            $interval = 60 * 30;
        } else {
            $interval = null;
        }
        return $interval;
    }
}
