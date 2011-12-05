<?php 

class inGraph_ViewModel extends inGraphBaseModel implements AgaviISingletonModel {
    
    public function initialize(AgaviContext $ctx, array $params = array()) {
        parent::initialize($ctx, $params);

        $this->read();
    }
    
    /**
     * 
     * TODO(el): Cache content.
     */
    protected function read() {
        $_views = iterator_to_array(
            AppKitIteratorUtil::RegexRecursiveDirectoryIterator(
                $this->getParameter('dir'),
                '/\.json$/i'
            ),
            true
        );
        
        $views = array();
        
        foreach($_views as $path => $view) {
            $content = json_decode(file_get_contents($view->getRealPath()),
                                   true);
            if(!$content) {
                AppKitAgaviUtil::log(
                    sprintf($this->tm->_('View %s not readable. Maybe the JSON format is wrong.'),
                    $view->getRealPath()), AgaviLogger::ERROR);
                continue;
            }
        
            $views[basename($path, '.json')] = $content;
        }
        
        $this->setParameter('views', $views);
    }
    
    public function getViews() {
        return array_keys($this->getParameter('views'));
    }
    
    public function getView($view) {
        return $this->getParameter("views[$view]");
    }
    
	public function save($name, $json) {
	    $view = $this->getParameter('dir') . DIRECTORY_SEPARATOR . $name . '.json';
	    if(is_readable($view) === false) {
	        return 'Error, view not found: ' . $view;
	    }
		$old = json_decode(file_get_contents($view, true));
		if(is_writable($view) !== true) {
		    return 'Error, permission denied: ' . $view;
		}
		$new = array_merge($old, json_decode($json, true));
		if(file_put_contents($view, json_encode($new), LOCK_EX) === false) {
		    return 'Error, unknown: ' . $view;
		}
		return true;
	}
}