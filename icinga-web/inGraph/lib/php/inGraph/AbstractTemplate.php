<?php

/**
 * inGraph_AbstractTemplate
 *
 * @copyright Copyright (c) 2012 Netways GmbH <support@netways.de>
 * @author Eric Lippmann <eric.lippmann@netways.de>
 * @package inGraph
 * @license http://www.gnu.org/licenses/gpl-3.0.html GNU General Public License
 */
abstract class inGraph_AbstractTemplate
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