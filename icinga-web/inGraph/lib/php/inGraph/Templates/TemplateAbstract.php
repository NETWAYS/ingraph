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

abstract class inGraph_Templates_TemplateAbstract
{
    /**
     * Decoded content of this template
     *
     * @var array $content
     */
    protected $content = null;

    /**
     * SplFileInfo as passed to the constructor
     *
     * @var SplFileInfo $fileInfo
     */
    protected $fileInfo = null;

    /**
     * True if this file does not yet exist in the file system
     *
     * @var boolean $phantom
     */
    protected $phantom = false;

    /**
     * Create a new template
     *
     * @param SplFileInfo $fileInfo
     * @param boolean $phantom
     * @throws inGraph_Exception
     * @return void
     */
    public function __construct(SplFileInfo $fileInfo, $phantom = false)
    {
        if (true === $phantom) {
            $this->content = array();

            $this->phantom = true;
        } else {
            if (false === $fileInfo->isReadable()) {
                $msg = __CLASS__ . ': failed to read ' . $fileInfo->getBaseName();
                error_log($msg, 0);
                throw new inGraph_Exception($msg);
            }

            if (false === ($content = file_get_contents($fileInfo->getRealpath()))) {
                $msg = __CLASS__ . ': failed to read ' . $fileInfo->getBaseName();
                error_log($msg, 0);
                throw new inGraph_Exception($msg);
            }

            $content = str_replace(array("\r", "\n"), array('', ''), $content);

            if (null === ($content = json_decode($content, true))) {
                $msg = __CLASS__ . ': failed to decode ' . $fileInfo->getBaseName();
                error_log($msg, 0);
                throw new inGraph_Exception($msg);
            }

            $this->content = $content;
        }

        $this->fileInfo = $fileInfo;
    }

    /**
     * Extend this template
     *
     * @param array $content
     * @return this
     */
    public function extend($content)
    {
        $a = $content;
        $b = $this->content;
        $c = array_merge(array(), $a, $b);

        if (array_key_exists('flot', $a) && array_key_exists('flot', $b)) {
            $c['flot'] = array_merge_recursive(
            array(), $a['flot'], $b['flot']);
        }

        $this->content = $c;

        return $this;
    }

    /**
     * Get the decoded content of this template
     *
     * @return array
     */
    public function getContent()
    {
        if (isset($this->content['flot'])) {
            if (isset($this->content['flot']['yaxis'])) {
                $yaxis =& $this->content['flot']['yaxis'];
                $yaxis['axisLabel'] = $yaxis['label'];
                unset($yaxis['label']);
            }
            if (isset($this->content['flot']['yaxes'])) {
                foreach ($this->content['flot']['yaxes'] as &$yaxis) {
                    if (isset($yaxis['label'])) {
                        $yaxis['axisLabel'] = $yaxis['label'];
                        unset($yaxis['label']);
                    }
                }
            }
        }
        return $this->content;
    }

    /**
     * Get the SplFileObject
     *
     * @return SplFileInfo
     */
    public function getInfo()
    {
        return $this->fileInfo;
    }

    /**
     * Save this template
     *
     * @throws inGraph_Exception
     * @return inGraph_AbstractTemplate
     */
    public function save()
    {
        try {
            $fileObject = $this->fileInfo->openFile('w');
        } catch (RuntimeException $e) {
            throw new inGraph_Exception($e->getMessage());
        }

        $contents = json_encode($this->content);

        $contents = inGraph_Json::prettyPrint($contents);

        if (false === file_put_contents($fileObject->getRealPath(), $contents,
                                        LOCK_EX)) {
            $msg = __CLASS__ . ': failed to write ' . $fileObject->getBaseName();
            error_log($msg, 0);
            throw new inGraph_Exception($msg);
        }

        return $this;
    }

    /**
     * Update this' content
     *
     * @param array $content
     * @return inGraph_AbstractTemplate
     */
    public function update($content)
    {
        if (false === $this->phantom) {
            $this->content = $content;
//             $this->extend($content);
        } else {
            $this->content = $content;
        }

        return $this;
    }
}
