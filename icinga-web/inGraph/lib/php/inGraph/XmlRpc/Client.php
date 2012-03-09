<?php

/**
 * An XML-RPC client implementation with cURL
 *
 * @copyright Copyright (c) 2012 Netways GmbH <support@netways.de>
 * @author Eric Lippmann <eric.lippmann@netways.de>
 * @package inGraph_XmlRpc
 * @license http://www.gnu.org/licenses/gpl-3.0.html GNU General Public License
 */
class inGraph_XmlRpc_Client
{
    /**
     * URL of the XML-RPC service
     *
     * @var string $serverAddress
     */
    protected $serverAddress = 'http://%s:%s@%s:%u/';

    /**
     * Cancel request after timeout in seconds, defaults to <tt>30</tt>
     *
     * @var int $timeout
     */
    protected $timeout = 30;

    /**
     * Create a new XML-RPC client to a remote server
     *
     * @param array $config configuration key-value pairs
     * <ul style="list-style-type: none;">
     *     <li><b>string</b> <i>user</i></li>
     *     <li><b>string</b> <i>pass</i></li>
     *     <li><b>string</b> <i>host</i></li>
     *     <li><b>int</b> <i>port</i></li>
     *     <li><b>int</b> <i>timeout</i></li>
     * </ul>
     */
    public function __construct(array $config = array())
    {
        $this->serverAddress = sprintf(
            $this->serverAddress,
            $config['user'],
            $config['pass'],
            $config['host'],
            $config['port']
        );
        if (array_key_exists('timeout', $config)) {
            $this->timeout = $config['timeout'];
        }
    }

    /**
     * Send an XML-RPC request
     *
     * @param string $method name of method to call
     * @param array $parameters array of method parameters
     * @return mixed decoded response
     * @throws inGraph_XmlRpc_Exception on cURL or server faults
     */
    public function call($method, array $parameters = array())
    {
        iconv_set_encoding('input_encoding', 'utf-8');
        iconv_set_encoding('output_encoding', 'utf-8');
        iconv_set_encoding('internal_encoding', 'utf-8');

        $response = null;

        $ch = curl_init();

        curl_setopt_array($ch, array(
            CURLOPT_URL => $this->serverAddress,
            CURLOPT_POSTFIELDS => $this->encode_request($method, $parameters),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            // Ignore proxy settings
            CURLOPT_PROXY => '',
            // Bypass "Expect: 100-continue" timeouts
            CURLOPT_HTTPHEADER => array('Expect:')
        ));

        $response = curl_exec($ch);
        if ($response === false || curl_getinfo($ch, CURLINFO_HTTP_CODE) != 200) {
            $e = $response === false ? curl_error($ch) : $response;
            curl_close($ch);
            throw new inGraph_XmlRpc_Exception('cURL Error: ' . $e);
        }
        curl_close($ch);
        $response = $this->decode_response($response);

        return $response;
    }

    /**
     * Generate UTF-8 encoded XML for a method request
     *
     * @param string $method name of method to call
     * @param array $parameters array of method parameters
     * @return string XML representation of the request
     */
    protected function encode_request($method, array $parameters = array())
    {
        return xmlrpc_encode_request(
            $method,
            $parameters,
            array(
                'escape' => array('non-print', 'non-markup'),
                'encoding' => 'utf-8'
            )
        );
    }

    /**
     * Decode ISO-8859-1 or UTF-8 encoded XML into native PHP types
     *
     * @param string $response XML response
     * @return mixed decoded response
     * @throws inGraph_XmlRpc_Exception on server faults
     */
    protected function decode_response($response)
    {
        $dr = xmlrpc_decode($response, 'utf-8');
        if ( ! $dr) {
            $dr = iconv('ISO-8859-1', 'utf-8', $response);
            $dr = xmlrpc_decode($dr, 'utf-8');
        }
        if ( ! is_array($dr)) {
            $dr = array($dr);
        }
        if (xmlrpc_is_fault($dr)) {
            throw new inGraph_XmlRpc_Exception(
                "Server fault: ${dr['faultCode']}: ${dr['faultString']}");
        }
        return $dr;
    }
}
