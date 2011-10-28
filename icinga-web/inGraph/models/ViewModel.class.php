<?php 

class inGraph_ViewModel extends AppKitBaseModel implements AgaviISingletonModel {
    
    public function initialize(AgaviContext $ctx, array $params = array()) {
        parent::initialize($ctx, $params);
        
        if(!realpath($dir = $this->getParameter('dir'))) {
            $this->setParameter(
            	'dir',
                AgaviConfig::get('core.root_dir') . DIRECTORY_SEPARATOR . $dir
            );
        }
        
        $this->readViews();
    }
    
    protected function readViews() {
        $_views = iterator_to_array(
            AppKitIteratorUtil::RegexRecursiveDirectoryIterator(
                $this->getParameter('dir'),
                '/\.json$/i'
            ),
            true
        );
        
        $views = array();
        
        foreach($_views as $path => $view) {
            $content = json_decode(file_get_contents($view->getRealPath()), true);
            if(!$content) {
                //_MVC_Logger::warn(sprintf('View %s not readable. Maybe the JSON format is wrong.', $view->getRealPath()));
                continue;
            }
        
            $views[basename($path, '.json')] = $content;
        }
        
        $this->setParameter('views', $views);
    }
    
    public function getViews() {
        return $this->getParameter('views');
    }
    
}