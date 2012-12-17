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
 * JsonValidator
 *
 * Validates json encoded strings. Exports decoded json on success.
 * Note to include
 * <code>
 * <ae:parameter name="export">ARGUMENT_NAME</ae:parameter>
 * </code>
 * in the validate xml.
 * For non-associative decoding add
 * <code>
 * <ae:parameter name="assoc">false</ae:parameter>
 * </code>
 * to the validate xml.
 *
 * @author Eric Lippmann <eric.lippmann@netways.de>
 * @package inGraph
 * @since 1.2
 */
class JsonValidator extends AgaviStringValidator
{
    protected function validate() {
        if (!parent::validate()) {
            $this->throwError();
            return false;
        }
        $json = json_decode(
            $this->getData($this->getArgument()),
            $this->getParameter('assoc', true));
        if (null === $json) {
            $this->throwError();
            return false;
        }
        $this->export($json);
        return true;
    }
}
