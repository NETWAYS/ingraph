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

/**
 * Filter accepting files with <tt>.json</tt> suffix
 */
class inGraph_Template_JsonFileIterator extends FilterIterator
{
    /**
     * Accept files with <tt>.json</tt> suffix
     *
     * @return bool Whether the current element of the iterator is acceptable
     *              through this filter
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
