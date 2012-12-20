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

abstract class inGraph_Templates_ManagerAbstract
{
    /**
     * Path to search for tempaltes
     *
     * @var string $path
     */
    protected $path = null;

    /**
     * Array of templates
     *
     * @var array[inGraph_AbstractTemplate] $templates
     */
    protected $templates = array();

    /**
     * Array of error messages
     *
     * @var array $errors
     */
    protected $errors = array();

    /**
     * The default template
     *
     * @var inGraph_AbstractTemplate $default
     */
    protected $default = null;

    protected $templateClass = null;

    /**
     * Create a new manager
     *
     * @param array $config configuration key-value pairs
     * <ul style="list-style-type: none;">
     *     <li><b>string</b> <i>dir</i> Directory to search for templates</li>
     *     <li><b>string</b> <i>default</i> Name of the default template</li>
     * </ul>
     */
    public function __construct(array $config = array())
    {
        $this->path = realpath($config['dir']);
        $this->default = $config['default'];
        $this->init();
    }

    /**
     * Read templates from file system
     *
     * @return void
     */
    protected function init()
    {
        $files = new inGraph_JsonFileIterator(
            new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($this->path)
            )
        );

        foreach ($files as $file) {
            try {
                $template = new $this->templateClass($file);
            } catch (Exception $e) {
                $this->errors[] = $e->getMessage();
                continue;
            }

            if ($file->getBasename() === $this->default) {
                $this->default = $template;
            } else {
                $templateName = $file->getBasename('.json');
                $this->templates[$templateName] = $template;
            }
        }

        ksort($this->templates);
    }

    /**
     * Fetch template by file name
     *
     * @param string $fileName
     * @return inGraph_Templates_TemplateAbstract
     */
    public function fetchTemplateByFileName($fileName)
    {
        $templateName = basename($fileName, '.json');

        $default = $this->default;

        if ( ! array_key_exists($templateName, $this->templates)) {
            return $default;
        }

        $template = $this->templates[$templateName]->extend($default->getContent());

        return $template;
    }

    /**
     * Get template names
     *
     * @return array[string]
     */
    public function getTemplateNames()
    {
        return array_keys($this->templates);
    }

    /**
     * Get count of templates
     *
     * @return number
     */
    public function getCount()
    {
        return count($this->templates);
    }

    /**
     * Check whether the manager has errors
     *
     * @return boolean
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

    /**
     * Create a new template
     *
     * @param string $fileName
     * @return instance of this' $templateClass
     */
    public function create($fileName)
    {
        $fileName = basename($fileName, '.json') . '.json';

        $path = $this->path . DIRECTORY_SEPARATOR . $fileName;

        $fileInfo = new SplFileInfo($path);

        $template = new $this->templateClass($fileInfo, true);

        return $template;
    }

    /**
     * Check whether a template is the default template
     *
     * @return boolean
     */
    public function isDefault(inGraph_Templates_TemplateAbstract $template)
    {
        return $template === $this->default;
    }
}
