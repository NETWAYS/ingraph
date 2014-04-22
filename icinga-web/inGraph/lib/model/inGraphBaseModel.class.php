<?php
/*
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
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for mor
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * inGraph. If not, see <http://www.gnu.org/licenses/gpl.html>.
 */

class inGraphBaseModel extends IcingaBaseModel
{
    protected $backend;

    public function initialize(AgaviContext $ctx, array $parameters = array())
    {
        parent::initialize($ctx, $parameters);
        $backendType = strtolower(AgaviConfig::get('modules.ingraph.backend'));
        $backendConfig = AgaviConfig::get('modules.ingraph.' . $backendType);
        switch ($backendType) {
            case 'ingraph':
                $backend = new inGraph_Backend_inGraph($backendConfig);
                break;
            case 'graphite':
                $backend = new inGraph_Backend_Graphite($backendConfig);
                break;
            default:
                throw new AgaviConfigurationException('Unknown inGraph backend ' . $backendType);
        }
        $this->backend = $backend;
    }
}
