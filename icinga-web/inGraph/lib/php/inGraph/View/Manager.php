<?php

/**
 * inGraph_View_Manager
 *
 * @copyright Copyright (c) 2012 Netways GmbH <support@netways.de>
 * @author Eric Lippmann <eric.lippmann@netways.de>
 * @package inGraph_View
 * @license http://www.gnu.org/licenses/gpl-3.0.html GNU General Public License
 */
class inGraph_View_Manager extends inGraph_Template_AbstractManager
{
    protected $templateClass = "inGraph_View";

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
    public function getViewNames()
    {
        return $this->getTemplateNames();
    }
}
