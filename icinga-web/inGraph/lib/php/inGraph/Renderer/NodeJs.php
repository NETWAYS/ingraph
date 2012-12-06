<?php

class inGraph_Renderer_NodeJs extends inGraph_Os_Process
{
    protected static $instance;

    public static function getInstance(array $args = array())
    {
        if (null === self::$instance) {
            self::$instance = new self($args);
        }
        return self::$instance;
    }

    public function input($data)
    {
        $pipes = $this->getPipes();
        fwrite($pipes->stdin, $data);
        fclose($pipes->stdin);
    }

    public function renderImage($args)
    {
        $this->input(json_encode($args));
        $process = $this->execute();
        $image = $process->stdout;
        $errors = $process->stderr;
        $this->close();
        if (!self::isPng($image)) {
            throw new Exception($errors);
        }
        return $image;
    }

    protected static function isPng($data)
    {
        $pngHeader = pack('H*', '89504E470D0A1A0A');
        if ($pngHeader === substr($data, 0, 8)) {
            return true;
        }
        return false;
    }
}
