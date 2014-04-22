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

class inGraph_Template_Template
{
    /**
     * Decoded JSON content
     *
     * @var array
     */
    protected $content;

    /**
     * SplFileInfo
     *
     * @var SplFileInfo
     */
    protected $fileInfo;

    /**
     * Create a new template
     *
     * @param array         $content
     * @param SplFileInfo   $fileInfo
     */
    public function __construct(array $content, SplFileInfo $fileInfo)
    {
        $this->content  = $content;
        $this->fileInfo = $fileInfo;
    }

    /**
     * @param   SplFileInfo $fileInfo
     *
     * @return  inGraph_Template_Template
     * @throws  inGraph_Exception
     */
    public static function createFromSplFileInfo(SplFileInfo $fileInfo)
    {
        try {
            $fileObject = $fileInfo->openFile('r');
        } catch (RuntimeException $e) {
            throw new inGraph_Exception($e->getMessage());
        }
        if ($fileObject->flock(LOCK_SH) === false) {
            throw new inGraph_Exception('Couldn\'t get the lock');
        }
        ob_start();
        $fileObject->fpassthru();
        $content = ob_get_contents();
        ob_end_clean();
        $content = str_replace(array("\r", "\n"), array('', ''), $content);
        if (($content = json_decode($content, true)) === null) {
            throw new inGraph_Exception('Can\'t decode template file '. $fileInfo->getRealPath());
        }
        return new self($content, $fileInfo);
    }

    private function assocArrayMergeRecursive($a, $b)
    {
        $merged = $a + $b;
        foreach($b as $key => $value) {
            if(is_array($value) && is_array($merged[$key])) {
                $merged[$key] = $this->assocArrayMergeRecursive($value, $merged[$key]);
            }
        }
        return $merged;
    }

    /**
     * Apply defaults
     *
     * @param   inGraph_Template_Template $defaults
     *
     * @return  self
     */
    public function applyDefaults(inGraph_Template_Template $defaults)
    {
        $this->content = $this->assocArrayMergeRecursive($this->content, $defaults->content);
        // Rename label to axisLabel
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
        return $this;
    }

    public function matches($pattern, $subject)
    {
        if (($match = preg_match($pattern, $subject)) === false) {
            throw new inGraph_Exception();
        }
        return $match === 1 ? true : false;
    }

    public function compile(array $plots)
    {
        $compiledContent    = array('series' => array());
        $query              = array();
        foreach ($this->content['series'] as $series) {
            foreach ($plots as $plot) {
                if ($this->matches($series['re'], $plot['plot'])) {
                    $compiledContent['series'][]    = $series + $plot;
                    $query[]                        = array('type' => $series['type']) + $plot;
                }
            }
        }
        return (object) array(
            'content'   => $compiledContent + $this->content,
            'query'     => $query
        );
    }

    /**
     * Get decoded JSON content
     *
     * @return array
     */
    public function getContent()
    {
        return $this->content;
    }

    /**
     * Get file information
     *
     * @return SplFileInfo
     */
    public function getSplFileInfo()
    {
        return $this->fileInfo;
    }

    /**
     * Save template to the file system
     *
     * @return self
     * @throws inGraph_Exception
     */
    public function save()
    {
        try {
            $fileObject = $this->fileInfo->openFile('w');
        } catch (RuntimeException $e) {
            throw new inGraph_Exception($e->getMessage());
        }
        if ($fileObject->flock(LOCK_EX) === false) {
            throw new inGraph_Exception('Couldn\'t get the lock');
        }
        $encodedContent = inGraph_Json::prettyPrint(json_encode($this->content));
        if ($fileObject->fwrite($encodedContent) === null) {
            throw new inGraph_Exception('Can\t write to file ' . $this->fileInfo->getRealPath());
        }
        $fileObject->flock(LOCK_UN);
        return $this;
    }

    public function setContent(array $content)
    {
        $this->content = $content;
        return $this;
    }
}
