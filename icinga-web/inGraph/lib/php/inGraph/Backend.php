<?php

/**
 * inGraph daemon access interface
 *
 * Collection of common interactions with the inGraph daemon
 *
 * @copyright Copyright (c) 2012 Netways GmbH <support@netways.de>
 * @author Eric Lippmann <eric.lippmann@netways.de>
 * @package inGraph
 * @license http://www.gnu.org/licenses/gpl-3.0.html GNU General Public License
 */
class inGraph_Backend
{
    /**
     * XML-RPC Client to use for requests
     *
     * @var inGraph_XmlRpc_Client
     */
    protected $client = null;

    /**
     * Create a new inGraph daemon access interface
     *
     * @param inGraph_XmlRpc_Client $client XML-RPC Client to use for requests
     * @return void
     */
    public function __construct(inGraph_XmlRpc_Client $client)
    {
        $this->client = $client;
    }

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
     *     <li><b>array[string]</b> <i>hosts</i> list of host names</li>
     * </ul>
     */
    public function fetchHosts()
    {
        $args = func_get_args();
        return $this->client->call('getHostsFiltered', $args);
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
     *     <li><b>array[array]</b> <i>services</i>
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
        return $this->client->call('getServices', $args);
    }

    /**
     * Fetch plots
     *
     * @param string $hostName
     * @param string $serviceName
     * @return array[array]
     * <ul style="list-style-type: none;">
     *     <li><b>string</b> <i>service</i></li>
     *     <li><b>string</b> <i>plot</i></li>
     * </ul>
     */
    public function fetchPlots()
    {
        $args = func_get_args();
        return $this->client->call('getPlots', $args);
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
        $values = $this->client->call('getPlotValues2', $args);

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
        return $this->client->call('addComment', $args);
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
        return $this->client->call('updateComment', $args);
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
        return $this->client->call('deleteComment', $args);
    }
}
