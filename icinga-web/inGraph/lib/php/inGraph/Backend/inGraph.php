<?php
/*
 * Copyright (C) 2013 NETWAYS GmbH, http://netways.de
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

class inGraph_Backend_inGraph extends inGraph_XmlRpc_Client implements inGraph_Backend
{
    public function fetchHosts($pattern, $limit = null, $offset = 0)
    {
        $args = func_get_args();
        return $this->call('getHosts', $args);
    }

    public function fetchServices($hostPattern, $servicePattern, $limit = null, $offset = 0)
    {
        $args = func_get_args();
        return $this->call('getServices', $args);
    }

    public function fetchPlots(
        $hostPattern, $servicePattern, $parentServicePattern, $plotPattern, $limit = null, $offset = 0
    ) {
        $args = func_get_args();
        return $this->call('getPlots', $args);
    }

    public function fetchValues($query, $start = null, $end = null)
    {
        $args = func_get_args();
        $values = $this->call('getPlotValues2', $args);

        foreach ($values['charts'] as &$chart) {
            $chart['group'] = $chart['host'];
            if ($chart['service']) {
                $chart['group'] .= ' - ' . $chart['service'];
            }
            $chart['group'] .= ' - ' . $chart['plot'];

            $chart['id'] = $chart['group'] . ' - ' . $chart['type'];
        }

        return $values;
    }

    public function createComment($host, $service, $time, $author, $comment)
    {
        // TODO: BROKEN?
        $args = func_get_args();
        return $this->call('addComment', $args);
    }

    public function updateComment($id, $host, $service, $time, $author, $comment)
    {
        // TODO: BROKEN?
        $args = func_get_args();
        return $this->call('updateComment', $args);
    }

    public function deleteComment($id)
    {
        // TODO: BROKEN?
        $args = func_get_args();
        return $this->call('deleteComment', $args);
    }

    /**
     * Fetch intervals
     *
     * @return array[string] <code><ul style="list-style-type: none;">
     *     <li><b>timeFrames</b> array[int][string]
     *         <ul style="list-style-type: none;">
     *             <li><i>id</i> int</li>
     *             <li><i>interval</i> int</li>
     *             <li><i>retention-period</i> int</li>
     *         </ul>
     *     </li>
     *     <li><b>total</b> int
     * </ul></code>
     */
    public function fetchIntervals()
    {
        $args = func_get_args();
        $tfs = $this->call('getTimeFrames', $args);
        return array(
            'timeFrames' => array_values($tfs),
            'total' => count($tfs)
        );
    }

    /**
     * {@inheritdoc}
     */
    public function getName()
    {
        return 'ingraph';
    }
}
