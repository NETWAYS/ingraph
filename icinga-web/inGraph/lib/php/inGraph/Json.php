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

class inGraph_Json
{
    /**
     * Pretty print a json string. This is a slight modified version of Zend_Json's
     * prettyPrint.
     * @param string Ugly json string
     * @return string Pretty json string
     */
    public static function prettyPrint($jsonString)
    {
        $tokens = preg_split('|([\{\}\[\],])|', $jsonString, -1,
                             PREG_SPLIT_DELIM_CAPTURE);
        $jsonPretty = '';
        $offset = 0;
        $eol = PHP_EOL;
        $indent = '    ';

        $quotes = false;

        foreach ($tokens as $index => $token) {
            if (0 === strlen($token)) {
                continue;
            }

            if ($quotes) {
                $jsonPretty .= $token;

                if (substr_count($token, '"') & 1) {
                    $quotes = ! $quotes;
                }

                continue;
            }

            $prefix = str_repeat($indent, $offset);

            if ($token === '{' || $token === '[') {
                ++$offset;

                if (strlen($jsonPretty) > 0 &&
                    $jsonPretty[strlen($jsonPretty) - 1] === $eol)
                {
                    $jsonPretty .= $prefix;
                }

                $jsonPretty .= $token . $eol;
            }
            else if ($token === '}' || $token === ']') {
                --$offset;

                $prefix = str_repeat($indent, $offset);

                $jsonPretty .= $eol . $prefix . $token;
            }
            else if ($token === ',') {
                $jsonPretty .= $token . $eol;
            }
            else if ($token === ':') {
                $jsonPretty .= $token . ' ';
            }
            else {
                $jsonPretty .= $prefix . $token;

                if (substr_count($token, '"') & 1) {
                    $quotes = ! $quotes;
                }
            }
        }

        $jsonPretty = preg_replace('/([\]}"]:)/', '\1 ', $jsonPretty);

        return $jsonPretty;
    }
}
