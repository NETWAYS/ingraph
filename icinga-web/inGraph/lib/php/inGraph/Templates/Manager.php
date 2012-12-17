<?php

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
