<?php
/**
 * inGraphBaseAction.class.php
 *
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
        if (false === $m) {
            $m = array();
            foreach($this->container->getValidationManager()->getReport()
                ->getErrorMessages() as $e
            ) {
                $m[] = $e;
            }
            $m = implode(' ', $m);
        }
        $this->setAttribute('errorMessage', $m);
        return 'Error';
    }

    public function getBackend()
    {
        if (null === $this->backend) {
            $this->backend = $this->getContext()->getModel(
                'Backend', 'inGraph',
                AgaviConfig::get('modules.ingraph.xmlrpc')
            );
        }
        return $this->backend;
    }
}
