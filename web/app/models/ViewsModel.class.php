<?php 

class ViewsModel extends _MVC_Model {
    
    protected $dir = null;
    
    protected $views = array();
    
    public function __construct($dir) {
        $this->dir = $dir;
        
        $this->readViews();
    }
    
    protected function readViews() {
        $views = iterator_to_array(_MVC_Util::RegexRecursiveDirectoryIterator($this->dir, '/\.json$/i'), true);
        
        foreach($views as $path => $view) {
            $content = json_decode(file_get_contents($view->getRealPath()), true);
            if(!$content) {
                //_MVC_Logger::warn(sprintf('View %s not readable. Maybe the JSON format is wrong.', $view->getRealPath()));
                continue;
            }
            
            $this->views[basename($path, '.json')] = $content;
        }
    }
    
    public function getViews() {
    	return $this->views;
    }
    
}