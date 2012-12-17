<?php

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
