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

class inGraph_Provider_ValuesSuccessView extends inGraphBaseView
{
    public function executeJson(AgaviRequestDataHolder $rd)
    {
        return json_encode($this->getAttribute('values'));
    }

    public function executeCsv(AgaviRequestDataHolder $rd)
    {
        $values = $this->getAttribute('values');
        $header = array('host', 'service', 'plot', 'type', 'x', 'y', 'unit');
        $handle = fopen('php://temp', 'w');
        fputcsv($handle, $header);
        if (array_key_exists('charts', $values)) {
            foreach($values['charts'] as $chart) {
                foreach($chart['data'] as $data) {
                    fputcsv($handle, array(
                        $chart['host'], $chart['service'], $chart['plot'],
                        $chart['type'], $data[0], $data[1], $chart['unit']
                    ));
                }
            }
        }
        fseek($handle, 0);

        $response = $this->getContainer()->getResponse();
        $response->setHttpHeader('Content-Type', 'text/csv');
        $response->setHttpHeader('Content-Disposition', 'attachment');
        return $handle;
    }

    public function executeXml(AgaviRequestDataHolder $rd)
    {
        $values = $this->getAttribute('values');
        $simple_xml = new SimpleXMLElement('<values></values>');
        if(array_key_exists('charts', $values)) {
            foreach($values['charts'] as $chart) {
                $nodes = array($chart['host'], $chart['service'],
                               $chart['plot'], $chart['type'], $chart['unit']);
                $el = $simple_xml;
                foreach($nodes as $i => $node) {
                    $xpath = '"/values/' . join(
                        '/', array_slice($nodes, 0, $i + 1)) . '"';
                    $path = $el->xpath($xpath);
                    if(empty($path)) {
                        $el = $el->addChild($node);
                    } else {
                        $el = $path[0];
                    }
                }
                foreach($chart['data'] as $data) {
                    $value = $el->addChild('value');
                    $value->addChild('x', $data[0]);
                    $value->addchild('y', $data[1]);
                }
            }
        }
        $dom = dom_import_simplexml($simple_xml)->ownerDocument;
        $dom->formatOutput = true;
        $dom->preserveWhiteSpace = false;

        $handle = fopen('php://temp', 'w');
        fwrite($handle, $dom->saveXML());
        fseek($handle, 0);

        $response = $this->getContainer()->getResponse();
        $response->setHttpHeader('Content-Type', 'text/xml');
        $response->setHttpHeader('Content-Disposition', 'attachment');
        return $handle;
    }
}
