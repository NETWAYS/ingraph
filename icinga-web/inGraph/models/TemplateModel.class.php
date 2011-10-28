<?php 

class inGraph_TemplateModel extends AppKitBaseModel implements AgaviISingletonModel {
    
    public function initialize(AgaviContext $ctx, array $params = array()) {
        parent::initialize($ctx, $params);
        
        $this->readTemplates();
    }
    
	protected function readTemplates() {
		$it = iterator_to_array(self::RegexRecursiveDirectoryIterator($this->getParameter('dir'), '/\.json$/i'), true);
		
		$templates = array();
		
		foreach($it as $path => $template) {
			$content = json_decode(file_get_contents($template->getRealPath()), true);
			if(!$content) {
				//_MVC_Logger::warn(sprintf('Template %s not readable. Maybe the JSON format is wrong.', $template->getRealPath()));
				continue;
			}
			
			if($template->getFilename() == $this->getParameter('default')) {
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
	
	public static function RegexRecursiveDirectoryIterator($dir, $re, $mode=RecursiveRegexIterator::MATCH) {
		return new RegexIterator(
			new RecursiveIteratorIterator(
				new RecursiveDirectoryIterator($dir)
			),
			$re,
			$mode
		);
	}
	
}