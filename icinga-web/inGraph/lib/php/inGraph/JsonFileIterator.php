<?php

/**
 * inGraph_JsonFileIterator
 *
 * Accept files with <tt>.json</tt> suffix
 *
 * @copyright Copyright (c) 2012 Netways GmbH <support@netways.de>
 * @author Eric Lippmann <eric.lippmann@netways.de>
 * @package inGraph
 * @license http://www.gnu.org/licenses/gpl-3.0.html GNU General Public License
 */
class inGraph_JsonFileIterator extends FilterIterator
{
    /**
     * Accept files with <tt>.json</tt> suffix
     * @return bool Whether the current element of the iterator is acceptable
     * through this filter
     */
    public function accept()
    {
        $current = $this->getInnerIterator()->current();
        if (false === $current->isFile()) {
            return false;
        }
        $filename = $current->getFilename();
        $sfx = substr($filename, -5);
        return $sfx === false ? false : strtolower($sfx) === '.json';
    }
}
