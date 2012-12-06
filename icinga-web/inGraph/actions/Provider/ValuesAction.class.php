<?php
/**
 * ValuesAction.class.php
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
 * @package inGraph_Provider
 */

class inGraph_Provider_ValuesAction extends inGraphBaseAction
{
    public function executeWrite(AgaviRequestDataHolder $rd)
    {
        $start = $start = $rd->getParameter('startx', null);
        $end = $rd->getParameter('endx', time());
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
