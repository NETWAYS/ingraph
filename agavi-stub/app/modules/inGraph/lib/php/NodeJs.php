<?php

/**
 * NodeJs class
 */
 
/**
 * This class allows to render Flot graphs to PNG images
 *
 * Usage example:
 *
 * <code>
 * $renderer = NodeJs::getInstance();
 * $png = $renderer->renderImage($flot_params);
 * </code>
 *
 * @author  Thomas Gelf <thomas@gelf.net>
 */
class NodeJs
{
    protected $command;
    protected $proc;
    protected $pipes;
    protected static $instance;
    protected $cnt_images = 0;
    protected $max_images = 100;
    protected $msg;

    /**
     * Render a flot image with the given parameters
     *
     * @throws NodeJs_Exception
     * @param  Array  Flot params
     * @return string
     */
    public function renderImage(& $params)
    {
        if ($this->cnt_images >= $this->max_images) {
            $this->closeNode();
            $this->cnt_images = 0;
        }
        $res = $this->process($params);
        $this->cnt_images++;
        if (! self::isPng($res)) {
            throw new NodeJs_Exception(
                'Renderer didn\'t give us a valid PNG: '
              . nl2br(htmlspecialchars($this->msg . "\n" . $this->readNodeErrors()))
            );
        }
        return $res;
    }

    /**
     * Singleton
     *
     * NodeJs will be forked only once, images and params are "streamed" over
     * STDIN and STDOUT
     *
     * @return NodeJs
     */
    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new NodeJs();
        }
        return self::$instance;
    }

    /**
     * Write a given string to the STDIN of the running nodejs subprocess
     *
     * @param  string Message to be written
     * @return void
     */
    protected function writeToNode($msg)
    {
        $node = $this->getPipes();
        $this->msg = $msg;
        fwrite($node->stdin, $msg . "\nTHEVERYENDOFMYJSON\n");
    }

    /**
     * Read a string from the STDOUT of the running nodejs subprocess
     *
     * TODO: Make reads non blocking based on select()
     *
     * @throws NodeJs_Exception
     * @return string
     */
    protected function readFromNode()
    {
        $node = $this->getPipes();
        $res = '';
        $finished = false;
        $cnt = 0;
        while (! $finished) {
            $cnt++;
            $data = fgets($node->stdout);
            // It's ugly, I know:
            if ($data === "THEVERYENDOFMYPNG\n" || feof($node->stdout)) {
                $finished = true;
            } else {
                $res .= $data;
            }
            if ($cnt > 10000) {
                // Well... shouldn't ever happen :p
                throw new NodeJs_Exception('Read failed badly');
            }
        }
        $res = substr($res, 0, -1);
        return $res;
    }

    /**
     * Read a string from the STDERER of the running nodejs subprocess
     *
     * TODO: Make reads non blocking based on select()
     *
     * @return string
     */
    protected function readNodeErrors()
    {
        $node = $this->getPipes();
        stream_set_blocking($node->stderr, 0);
        $err = stream_get_contents($node->stderr);
        return $err;
    }

    /**
     * Pass given config to node and return it's result
     *
     * @param  array  Flot params
     * @return string
     */
    protected function process(& $params)
    {
        $this->writeToNode(json_encode($params));
        $res = $this->readFromNode();
        // This is how error handling has been done before:
        // $err = $this->readNodeErrors();
        // $err = false;
        // if ($err) {
        //     throw new NodeJs_Exception(sprintf(
        //         'Running "%s" failed: %s',
        //         $this->command,
        //         $err
        //     ));
        // }
        return $res;
    }

    /**
     * Return the renderers standard pipes: STDIN, STDOUT and STDERR
     *
     * Forks ingraph-renderer (nodejs) if required
     *
     * @return object
     */
    protected function getPipes()
    {
        if ($this->proc === null) {
            $descriptors = array(
                0 => array('pipe', 'r'),
                1 => array('pipe', 'w'),
                2 => array('pipe', 'w')
            );
            $cwd = AgaviConfig::get('core.module_dir') . '/inGraph/lib/js/nodejs';
            $env = null;
            $this->command = $cwd . '/ingraph-renderer.js';

            $this->proc = proc_open(
                $this->command,
                $descriptors,
                $this->pipes,
                $cwd,
                $env
            );
            if (! is_resource($this->proc)) {
                throw new NodeJs_Exception(sprintf(
                    'Cannot fork "%s"',
                    $cmd
                ));
            }
        }
        return (object) array(
            'stdin' => & $this->pipes[0],
            'stdout' => & $this->pipes[1],
            'stderr' => & $this->pipes[2]
        );
    }

    /**
     * Whether a given string has a valid PNG header
     *
     * @param  string PNG file
     * @return boolean
     */
    protected static function isPng(& $data)
    {
        $png_header = pack('H*', '89504E470D0A1A0A');
        if (substr($data, 0, 8) === $png_header) {
            return true;
        }
        return false;
    }

    /**
     * Effectively close the forked nodejs instance
     *
     * Closes all file handles / pipes to the subprocess and returns it's exit
     * code
     *
     * @return int
     */
    protected function closePipes()
    {
        if ($this->proc === null) return 0;
        $node = $this->getPipes();
        fclose($node->stdin);
        fclose($node->stdout);
        fclose($node->stderr);
        $result = proc_close($this->proc);
        $this->proc = null;
        return $result;
    }

    /**
     * Close the forked nodejs instance 
     *
     * @throws NodeJs_Exception
     * @return void
     */
    protected function closeNode()
    {
        if ($this->closePipes() !== 0) {
            throw new NodeJs_Exception(sprintf(
                'Running "%s" failed with exit code (%d)',
                $this->command,
                $retval
            ));
        }
    }

    /**
     * Destructor, make sure nodejs is shutting down cleanly
     *
     * @return void
     */
    public function __destruct()
    {
        if ($this->closePipes() !== 0) {
            // Cannot throw errors here
            echo sprintf(
                'Running "%s" failed with exit code (%d)',
                $this->command,
                $retval
            );
        }
    }
}

/**
 * NodeJs_Exception class
 *
 * @copyright  Copyright (c) 2011 Netways GmbH <support@netways.de>
 * @author     Thomas Gelf <thomas@gelf.net>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU General Public License
 */
class NodeJs_Exception extends Exception {}