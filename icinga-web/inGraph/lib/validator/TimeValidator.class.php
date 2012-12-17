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

/**
 * TimeValidator
 *
 * Validates either unix timestamps or english textual date or time. Modifies
 * the original value if it is the latter.
 *
 * @author Eric Lippmann <eric.lippmann@netways.de>
 * @package inGraph
 * @since 1.2
 */
class TimeValidator extends AgaviValidator
{
    protected function validate()
    {
        $time =& $this->getData($this->getArgument());
        if (!is_scalar($time)) {
            $this->throwError();
            return false;
        }

        if (!is_numeric($time)) {
            $time = strtotime($time);
            if (!$time) {
                $this->throwError();
                return false;
            }
        } else {
            $time = (int) $time;
            if (0 > $time) {
                $this->throwError();
                return false;
            }
        }
        return true;
    }
}
