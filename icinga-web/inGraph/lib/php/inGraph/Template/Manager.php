<?php

/**
 * inGraph Template Manager
 *
 * @copyright Copyright (c) 2012 Netways GmbH <support@netways.de>
 * @author Eric Lippmann <eric.lippmann@netways.de>
 * @package inGraph_Template
 * @license http://www.gnu.org/licenses/gpl-3.0.html GNU General Public License
 */
class inGraph_Template_Manager extends inGraph_Template_AbstractManager
{
    protected $templateClass = "inGraph_Template";

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
