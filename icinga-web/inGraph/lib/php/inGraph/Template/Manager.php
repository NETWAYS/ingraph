<?php
/*
 * Copyright (C) 2013 NETWAYS GmbH, http://netways.de
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

class inGraph_Template_Manager
{
    /**
     * Path to templates
     *
     * @var string
     */
    private $path = null;

    /**
     * Templates
     *
     * @var inGraph_Template_Template[]
     */
    private $templates = array();

    /**
     * Default template
     *
     * @var inGraph_Template_Template
     */
    private $default;

    /**
     * Template class
     *
     * @var string
     */
    private $templateClass;


    private $errors = array();

    /**
     * Create a new manager
     *
     * @param array[string] $config         Configuration key-value pairs
     * @param string        $templateClass  Template class
     */
    public function __construct(array $config = array(), $templateClass = 'inGraph_Template_Template')
    {
        $this->path             = realpath($config['path']);
        $this->default          = $config['default'];
        $this->templateClass    = $templateClass;
    }

    /**
     * Collect and instantiate templates from path
     */
    public function collectTemplates()
    {
        $files = new inGraph_Template_JsonFileIterator(
            new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($this->path)
            )
        );
        foreach ($files as $fileInfo) {
            try {
                $template = call_user_func(array($this->templateClass, 'createFromSplFileInfo'), $fileInfo);
            } catch (inGraph_Exception $e) {
                $this->errors[] = $e->getMessage();
                continue;
            }

            if ($fileInfo->getBasename() === $this->default) {
                $this->default = $template;
            } else {
                $templateName = $fileInfo->getBasename('.json');
                $this->templates[$templateName] = $template;
            }
        }
        ksort($this->templates);
    }

    /**
     * Fetch template by filename
     *
     * Returns default template in case template by filename is not found
     *
     * @param   string $filename
     *
     * @return  inGraph_Template_Template
     */
    public function fetchTemplateByFileName($filename)
    {
        $templateName = basename($filename, '.json');
        if (!array_key_exists($templateName, $this->templates)) {
            return $this->default;
        }
        return $this->templates[$templateName]->applyDefaults($this->default);
    }

    public function fetchTemplate($subject)
    {
        foreach ($this->templates as $template) {
            $content = $template->getContent();
            if ($template->matches($content['re'], $subject)) {
                return $template->applyDefaults($this->default);
            }
        }
        return $this->default;
    }

    /**
     * Check whether a template is the default template
     *
     * @param   inGraph_Template_Template $template
     *
     * @return  bool
     */
    public function isDefault(inGraph_Template_Template $template)
    {
        return $template === $this->default;
    }

    /**
     * Get template names
     *
     * @param int $limit
     * @param int $offset
     *
     * @return string[]
     */
    public function getTemplateNames($limit = null, $offset = 0)
    {
        return array_slice(array_keys($this->templates), $offset, $limit);
    }

    /**
     * Get count of templates
     *
     * @return int
     */
    public function getCount()
    {
        return count($this->templates);
    }

    /**
     * Check whether the manager has errors
     *
     * @return bool
     */
    public function hasErrors()
    {
        return count($this->errors) > 0 ? true : false;
    }

    /**
     * Get errors
     *
     * @return array
     */
    public function getErrors()
    {
        return $this->errors;
    }
}
