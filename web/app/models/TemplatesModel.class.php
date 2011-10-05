<?php 

class TemplatesModel extends _MVC_Model {
	
	protected $dir = null;
	
	protected $templates = array();
	
	protected $default = null;
    
	public function __construct($dir, $default) {
		$this->dir = $dir;
		
		$this->readTemplates($default);
	}
	
	protected function readTemplates($default) {
		$templates = iterator_to_array(_MVC_Util::RegexRecursiveDirectoryIterator($this->dir, '/\.json$/i'), true);
		
		foreach($templates as $path => $template) {
			$content = json_decode(file_get_contents($template->getRealPath()), true);
			if(!$content) {
				//_MVC_Logger::warn(sprintf('Template %s not readable. Maybe the JSON format is wrong.', $template->getRealPath()));
				continue;
			}
			
			if($template->getFilename() == $default) {
				$this->default = $content;
			} else {
				$this->templates[] = $this->default ? array_merge($this->default, $content) : $content;
			}
		}
	}
	
	public function getTemplate($service) {
		$serviceTemplate = array();
		
		foreach($this->templates as $template) {
			if(preg_match($template['re'], $service)) {
				$serviceTemplate = array_merge($serviceTemplate, $template);
			}
		}
		
		if(!count($serviceTemplate)) {
			$serviceTemplate = $this->default;
		}
		
		return $serviceTemplate;
	}
	
}