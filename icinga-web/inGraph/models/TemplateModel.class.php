<?php 

class inGraph_TemplateModel extends inGraphBaseModel implements AgaviISingletonModel {
    
    public function initialize(AgaviContext $ctx, array $params = array()) {
        parent::initialize($ctx, $params);
        
        $this->read();
    }
    
    /**
     * 
     * TODO(el): Cache content.
     */
	protected function read() {
        $it = iterator_to_array(
            AppKitIteratorUtil::RegexRecursiveDirectoryIterator(
                $this->getParameter('dir'), '/\.json$/i'), true);
		
		$templates = array();
		
		foreach($it as $template) {
			$content = json_decode(file_get_contents($template->getRealPath()),
			                       true);
			if(!$content) {
                AppKitAgaviUtil::log(
                    sprintf($this->tm->_('Template %s not readable. Maybe the JSON format is wrong.'),
                    $template->getRealPath()), AgaviLogger::ERROR);
				continue;
			}
			
			if($template->getFilename() === $this->getParameter('default')) {
				$this->setParameter('defaultContent', $content);
			} else {
				$templates[] = ($d = $this->getParameter('defaultContent', false)) ? array_merge($d, $content) : $content;
			}
		}
		
		$this->setParameter('templates', $templates);
	}
	
	public function getTemplate($service) {
		$serviceTemplate = array();
		
		foreach($this->getParameter('templates') as $template) {
			if(preg_match($template['re'], $service)) {
				$serviceTemplate = array_merge($serviceTemplate, $template);
			}
		}
		
		if(!count($serviceTemplate)) {
			$serviceTemplate = $this->getParameter('defaultContent');
		}
		
		return $serviceTemplate;
	}
}