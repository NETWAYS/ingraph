<?php

namespace Graphite;

use Graphite\Exception\ServerException;
use Graphite\Exception\EncodingException;

/**
 * cURL Graphite client
 */
class Client
{
    /**
     * Graphite server's URL API
     *
     * @var string
     */
    private $serverAddress;

    /**
     * Cancel request after timeout in seconds
     *
     * @var int
     */
    private $timeout = 30;

    /**
     * Create Graphite Client
     *
     * @param string $serverAddress Graphite server's URL API
     */
    public function __construct($serverAddress)
    {
        $this->serverAddress = rtrim($serverAddress, '/') . '/';
    }

    /**
     * Encode POST data
     *
     * @param   array $postData
     *
     * @return  string
     */
    private function encodePostData(array $postData)
    {
        return preg_replace('/%5B[0-9]+%5D/', '', http_build_query($postData));
    }

    /**
     * Return the JSON encoded response in appropriate PHP type
     *
     * @param   string $response
     *
     * @return  mixed
     * @throws  EncodingException
     */
    private function decodeResponse($response)
    {
        $decodedResponse = json_decode($response, true);
        if ($decodedResponse === null) {
            throw new EncodingException('Got invalid JSON response from Graphite: "' . $response . '"');
        }
        return $decodedResponse;
    }

    /**
     * Actually query Graphite
     *
     * @param   string  $path
     * @param   array   $postData
     *
     * @return  array
     * @throws  ServerException
     */
    private function doPOST($path, array $postData = array())
    {
        $encodedPostData = $this->encodePostData($postData);
        $response = null;
        $ch = curl_init();
        curl_setopt_array($ch, array(
            CURLOPT_URL             => $this->serverAddress . $path,
            CURLOPT_POST            => true,
            CURLOPT_POSTFIELDS      => $encodedPostData,
            CURLOPT_RETURNTRANSFER  => true,
            CURLOPT_TIMEOUT         => $this->timeout,
            CURLOPT_PROXY           => '',
            CURLOPT_HTTPHEADER      => array(
                'Expect:'  // Bypass "Expect: 100-continue" timeouts
            ),
            CURLOPT_SSL_VERIFYPEER  => false
        ));

        $response = curl_exec($ch);
        if ($response === false || curl_getinfo($ch, CURLINFO_HTTP_CODE) != 200) {
            $e = $response === false ? curl_error($ch) : $response;
            curl_close($ch);
            throw new ServerException('Graphite Error: ' . $e);
        }
        curl_close($ch);
        $response = $this->decodeResponse($response);

        return $response;
    }

    /**
     * Query Graphite to look for metrics that match the given pattern
     *
     * @param   string $pattern
     *
     * @return  array
     */
    public function findMetric($pattern, $limit = null, $offset = 0)
    {
        $metrics = $this->doPOST(
            'metrics/find',
            array(
                'format'    => 'completer',
                'query'     => $pattern
            )
        );
        return array(
            'total'     => count($metrics['metrics']),
            'metrics'   => array_slice($metrics['metrics'], $offset, $limit)
        );
    }

    public function fetchMetric($target, $from = null, $until = null)
    {
        $metrics = $this->doPOST(
            'render',
            array(
                'format'    => 'json',
                'target'    => $target,
                'from'      => $from,
                'until'     => $until
            )
        );
        return $metrics;
    }
}
