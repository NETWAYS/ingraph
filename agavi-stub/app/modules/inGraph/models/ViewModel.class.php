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
                $this->logger->log(
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
}