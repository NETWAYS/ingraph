<?php

/**
 * inGraph_Json
 *
 * @package inGraph
 * @license http://www.gnu.org/licenses/gpl-3.0.html GNU General Public License
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
