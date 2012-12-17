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

class inGraph_Daemon_Client extends inGraph_XmlRpc_Client
{
    /**
     * Fetch hosts
     *
     * Usage:
     * <code>
     * // Fetch all hosts
     * $hosts = $backend->fetchHosts('%');
     * $hosts = $backend->fetchHosts('*');
     *
     * // Fetch all hosts prefixed with 'node'
     * $hosts = $backend->fetchHosts('node%');
     * </code>
     *
     * @param string $hostPattern may contain '%' or '*' as wildcard character
     * @param int $limit optional constrain the number of rows returned
     * @param int $offset optional offset of the first row to return
     * @return array
     * <ul style="list-style-type: none;">
     *     <li><b>int</b> <i>total</i> total number of records found</li>
     *     <li><b>string[]</b> <i>hosts</i> list of host names</li>
     * </ul>
     */
    public function fetchHosts()
    {
        $args = func_get_args();
        return $this->call('getHosts', $args);
    }

    /**
     * Fetch services
     *
     * @param string $hostPattern may contain '%' or '*' as wildcard character
     * @param string $servicePattern may contain '%' or '*' as wildcard character
     * @param int $limit optional constrain the number of rows returned
     * @param int $offset optional offset of the first row to return
     * @return array
     * <ul style="list-style-type: none;">
     *     <li><b>int</b> <i>total</i> number of records found</li>
     *     <li><b>array</b> <i>services</i>
     *         <ul style="list-style-type: none;">
     *             <li><b>string</b> <i>service</i></li>
     *             <li><b>string</b> <i>parent_service</i></li>
     *         </ul>
     *     </li>
     * </ul>
     */
    public function fetchServices()
    {
        $args = func_get_args();
        return $this->call('getServices', $args);
    }

    /**
     * Fetch plots
     *
     * @param string $hostNamePattern may contain '%' as wildcard character
     * @param string $serviceNamePattern may contain '%' as wildcard character
     * @param string $parentServiceNamePattern may contain '%' as wildcard character
     * @param string $plotNamePattern may contain '%' as wildcard character
     * @param int $limit optional constrain the number of rows returned
     * @param int $offset optional offset of the first row to return
     * @return array
     * <ul style="list-style-type: none;">
     *     <li><b>int</b> <i>total</i> number of records found</li>
     *     <li><b>array</b> <i>plots</i>
     *         <ul style="list-style-type: none;">
     *             <li><b>int</b> <i>id</i></li>
     *             <li><b>string</b> <i>host</i></li>*
     *             <li><b>string</b> <i>service</i></li>
     *             <li><b>string</b> <i>parent_service</i></li>
     *             <li><b>string</b> <i>plot</i></li>
     *         </ul>
     *     </li>
     * </ul>
     */
    public function fetchPlots()
    {
        $args = func_get_args();
        return $this->call('getPlots', $args);
    }

    /**
     * Fetch values
     *
     * @param array $query
     * @param int|null $start optional start timestamp of the first value to return
     * @param int $end optional end timestamp of the last value to return
     * @param int $interval optional x offset between two datapoints
     * @param int $nullTolerance optional specify how many consecutive datapoints may be missing before inserting null values
     * @return array
     * <ul style="list-style-type: none;">
     *     <li><b>int</b> <i>min_timestamp timestamp</i> of first available data</li>
     *     <li><b>int</b> <i>max_timestamp timestamp</i> of last available data</li>
     *     <li><b>array</b> <i>comments</i></li>
     *     <li><b>array</b> <i>statusdata</i></li>
     *     <li><b>array</b> <i>charts</i></li>
     * </ul>
     */
    public function fetchValues()
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

    /**
     * Create comment
     *
     * @param string $hostName
     * @param string|null $parent_service
     * @param string $serviceName
     * @param int $timestamp
     * @param string $author
     * @param string $comment
     * @return int id
     */
    public function createComment()
    {
        $args = func_get_args();
        return $this->call('addComment', $args);
    }

    /**
     * Update comment
     *
     * @param int $id
     * @param string $hostName
     * @param string|null $parent_service
     * @param string $serviceName
     * @param int $timestamp
     * @param string $author
     * @param string $comment
     * @return int id
     */
    public function updateComment()
    {
        $args = func_get_args();
        return $this->call('updateComment', $args);
    }

    /**
     * Delete comment
     *
     * @param int $id
     * @return void
     */
    public function deleteComment()
    {
        $args = func_get_args();
        return $this->call('deleteComment', $args);
    }

    /**
     * Fetch intervals
     *
     * @return array
     * <ul style="list-style-type: none;">
     *     <li><b>string[]</b> <code>interval</code>
     *         <ul style="list-style-type: none;">
     *             <li><b>int</b> <i>id</i></li>
     *             <li><b>int</b> <i>interval</i></li>*
     *             <li><b>int</b> <i>retention-period</i></li>
     *         </ul>
     *     </li>
     * </ul>
     */
    public function fetchIntervals()
    {
        $args = func_get_args();
        $tfs = $this->client->call('getTimeFrames', $args);
        return array(
            'timeFrames' => array_values($tfs),
            'total' => count($tfs)
        );
    }
}
