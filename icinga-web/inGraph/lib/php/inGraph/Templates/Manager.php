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

class inGraph_Templates_Manager extends inGraph_Templates_ManagerAbstract
{
    protected $templateClass = "inGraph_Templates_Template";

    /**
     * Fetch template for a service
     *
     * @param string $service
     * @return inGraph_Template
     */
    public function fetchTemplate($service)
    {
        $template = $this->default;
        foreach ($this->templates as $tpl) {
            if ($tpl->matches($service)) {
                $template = $tpl->extend($template->getContent());
            }
        }
        return $template;
    }
}
