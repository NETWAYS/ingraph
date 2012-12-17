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

class inGraphBaseView extends IcingaBaseView
{
    public function executeJson(AgaviRequestDataHolder $rd)
    {
        if (null !== ($err = $this->getAttribute('errorMessage', null))) {
            $this->getContainer()->getResponse()->setHttpStatusCode(500);
            return json_encode(array(
                'success' => false,
                'results' => array(),
                'errorMessage' => $err
            ));
        }
        return json_encode(array(
            'success' => true,
            'results' => array()
        ));
    }

    public function executeCsv(AgaviRequestDataHolder $rd) {
        if (null !== ($err = $this->getAttribute('errorMessage', null))) {
            $this->getContainer()->getResponse()->setHttpStatusCode(500);
        }
    }

    public function executeXml(AgaviRequestDataHolder $rd) {
        if (null !== ($err = $this->getAttribute('errorMessage', null))) {
            $this->getContainer()->getResponse()->setHttpStatusCode(500);
        }
    }
}
