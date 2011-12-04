<?php

/**
 * Benchmark class
 *
 * @category Mocoli
 */
/**
 * This class provides a simple and lightweight benchmark class
 *
 * <code>
 * Benchmark::measure('Program started');
 * // ...do something...
 * Benchmark::measure('Task finieshed');
 * Benchmark::dump();
 * </code>
 *
 * @copyright  Copyright (c) 2011 Netways GmbH <support@netways.de>
 * @author     Thomas Gelf <thomas@gelf.net>
 * @package    Mocoli
 * @license    http://www.gnu.org/copyleft/gpl.html GNU General Public License
 */
class Benchmark
{
    const TIME   = 0x01;
    const MEMORY = 0x02;

    protected static $instance;
    protected $start;
    protected $measures = array();

    /**
     * Add a measurement to your benchmark
     *
     * The same identifier can also be used multiple times
     *
     * @param  string  A comment identifying the current measurement
     * @return void
     */
    public static function measure($message)
    {
        self::getInstance()->measures[] = (object) array(
            'timestamp'   => microtime(true),
            'memory_real' => memory_get_usage(true),
            'memory'      => memory_get_usage(),
            'message'     => $message
        );
    }

    /**
     * Throws all measurements away
     *
     * This empties your measurement table and allows you to restart your
     * benchmark from scratch
     *
     * @return void
     */
    public static function reset()
    {
        self::$instance = null;
    }

    /**
     * Rerieve benchmark start time
     *
     * This will give you the timestamp of your first measurement
     *
     * @return float
     */
    public static function getStartTime()
    {
        return self::getInstance()->start;
    }

    /**
     * Dump benchmark data
     *
     * Will dump a text table if running on CLI and a simple HTML table
     * otherwise. Use Benchmark::TIME and Benchmark::MEMORY to
     * choose whether you prefer to show either time or memory or both in your
     * output
     *
     * @param  int   Whether to get time and/or memory summary
     * @return string
     */
    public static function dump($what = null)
    {
        echo self::renderToHtml($what);
    }

    /**
     * Render benchmark data to a simple text table
     *
     * Use Benchmark::TIME and Benchmark::MEMORY to choose whether
     * you prefer to show either time or memory or both in your output
     *
     * @param  int   Whether to get time and/or memory summary
     * @return string
     */
    public static function renderToText($what = null)
    {
        $data = self::prepareDataForRendering($what);
        $sep = '+';
        $title = '|';
        foreach ($data->columns as & $col) {
            $col->format = ' %'
                   . ($col->align === 'right' ? '' : '-')
                   . $col->maxlen . 's |';

            $sep   .= str_repeat('-', $col->maxlen) . '--+';
            $title .= sprintf($col->format, $col->title);
        }

        $out = $sep . "\n" . $title . "\n" . $sep . "\n";
        foreach ($data->rows as & $row) {
            $r = '|';
            foreach ($data->columns as $key => & $col) {
                $r .= sprintf($col->format, $row[$key]);
            }
            $out .= $r . "\n";
        }

        $out .= $sep . "\n";
        return $out;
    }

    /**
     * Render benchmark data to a simple HTML table
     *
     * Use Benchmark::TIME and Benchmark::MEMORY to choose whether
     * you prefer to show either time or memory or both in your output
     *
     * @param  int   Whether to get time and/or memory summary
     * @return string
     */
    public static function renderToHtml($what = null)
    {
        $data = self::prepareDataForRendering($what);

        // TODO: Move formatting to CSS file
        $style = 'font-family: monospace; font-size: 1.5em; width: 100%';
        $html = '<table style="' . $style . '">' . "\n" . '<tr>';
        foreach ($data->columns as & $col) {
            $html .= sprintf(
                '<td align="%s">%s</td>',
                $col->align,
                htmlspecialchars($col->title)
            );
        }
        $html .= "</tr>\n";

        foreach ($data->rows as & $row) {
            $html .= '<tr>';
            foreach ($data->columns as $key => & $col) {
                $html .= sprintf(
                    '<td align="%s">%s</td>',
                    $col->align,
                    $row[$key]
                );
            }
            $html .= "</tr>\n";
        }
        return $html;
    }

    /**
     * Prepares benchmark data for output
     *
     * Use Benchmark::TIME and Benchmark::MEMORY to choose whether
     * you prefer to have either time or memory or both in your output
     *
     * @param  int   Whether to get time and/or memory summary
     * @return array
     */
    protected static function prepareDataForRendering($what = null)
    {
        if ($what === null) {
            $what = self::TIME | self::MEMORY;
        }

        $columns = array(
            (object) array(
                'title'  => 'Time',
                'align'  => 'left',
                'maxlen' => 4
            ),
            (object) array(
                'title'  => 'Description',
                'align'  => 'left',
                'maxlen' => 11
            )
        );
        if ($what & self::TIME) {
            $columns[] = (object) array(
                'title'  => 'Offset (ms)',
                'align'  => 'right',
                'maxlen' => 11
            );
            $columns[] = (object) array(
                'title'  => 'Duration (ms)',
                'align'  => 'right',
                'maxlen' => 13
            );
        }
        if ($what & self::MEMORY) {
            $columns[] = (object) array(
                'title'  => 'Mem (diff)',
                'align'  => 'right',
                'maxlen' => 10
            );
            $columns[] = (object) array(
                'title'  => 'Mem (total)',
                'align'  => 'right',
                'maxlen' => 11
            );
        }

        $bench = self::getInstance();
        $last = $bench->start;
        $rows = array();
        $lastmem = 0;
        foreach ($bench->measures as $m) {
            $micro = sprintf(
                '%03d',
                round(($m->timestamp - floor($m->timestamp)) * 1000)
            );
            $vals = array(
                date('H:i:s', $m->timestamp) . '.' . $micro,
                $m->message
            );

            if ($what & self::TIME) {
                $m->relative = $m->timestamp - $bench->start;
                $m->offset   = $m->timestamp - $last;
                $last = $m->timestamp;
                $vals[] = sprintf('%0.3f', $m->relative * 1000);
                $vals[] = sprintf('%0.3f', $m->offset * 1000);
            }

            if ($what & self::MEMORY) {
                $mem = $m->memory - $lastmem;
                $lastmem = $m->memory;
                $vals[] = self::formatBytes($mem);
                $vals[] = self::formatBytes($m->memory);
            }

            $row = & $rows[];
            foreach ($vals as $col => $val) {
                $row[$col] = $val;
                $columns[$col]->maxlen = max(
                    strlen($val),
                    $columns[$col]->maxlen
                );
            }
        }

        return (object) array(
            'columns' => $columns,
            'rows' => $rows
        );
    }

    /**
     * Singleton
     *
     * Benchmark is run only once, but you are not allowed to directly
     * access the getInstance() method
     *
     * @return Benchmark
     */
    protected static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new Benchmark();
            self::$instance->start = microtime(true);
        }

        return self::$instance;
    }

    /**
     * Constructor
     *
     * Singleton usage is enforced, the only way to instantiate Benchmark
     * is by starting your measurements
     *
     * @return void
     */
    protected function __construct() {}
    
    public static function formatBytes($byte)
    {
        $unit = array('B','KB','MB','GB','TB','PB');
        $prefix = '';
        if ($byte < 0) {
            $byte = abs($byte);
            $prefix = '-';
        }
        return sprintf(
            '%s%0.2f %s',
            $prefix,
            round($byte / pow(1024, $i = floor(log($byte, 1024))), 2),
            $unit[$i]
        );
    }
    
}

