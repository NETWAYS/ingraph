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

class inGraph_Views_Manager extends inGraph_Templates_ManagerAbstract
{
    protected $templateClass = "inGraph_Views_View";

    /**
     * Fetch view by name
     *
     * @param string $viewName
     * @return inGraph_View
     */
    public function fetchView($viewName)
    {
        return $this->fetchTemplateByFileName($viewName);
    }

    /**
     * Get view names
     *
     * @return array
     */
    public function getViewNames($offset, $length)
    {
        return array_slice($this->getTemplateNames(), $offset, $length);
    }
}
