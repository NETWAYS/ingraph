<?php 

class inGraph_TemplateModel extends inGraphBaseModel implements AgaviISingletonModel {
    
    public function initialize(AgaviContext $ctx, array $params = array()) {
        parent::initialize($ctx, $params);
        
        $this->read();
    }
    
    // TODO(el): Cache
	protected function read() {
        $it = iterator_to_array(
            AppKitIteratorUtil::RegexRecursiveDirectoryIterator(
                $this->getParameter('dir'), '/\.json$/i'), true);
		
		$templates = array();
		
		foreach($it as $template) {
			$content = json_decode(file_get_contents($template->getRealPath()),
			                       true);
			if(!$content) {
                $this->logger->log(
                    sprintf($this->tm->_('Template %s not readable. Maybe the JSON format is wrong.'),
                    $template->getRealPath()), AgaviLogger::ERROR);
				continue;
			}
			
			if($template->getFilename() === $this->getParameter('default')) {
				$this->setParameter('defaultContent', $content);
			} else {
				$templates[basename($template->getFilename(), '.json')] = $content;
			}
		}
		
		$this->setParameter('templates', $templates);
	}
	
	protected function validateTemplate($t) {
	    if(!array_key_exists('re', $t)) {
	        $t['re'] = '//';
	    }
	    if(!array_key_exists('series', $t)) {
	        $t['series'] = array(
	            're' => '//',
	            'type' => 'avg'
	        );
	    } else {
	        foreach($t['series'] as $series) {
	            if(!array_key_exists('re', $series)) {
	                $series['re'] = '//';
	            }
	            if(!array_key_exists('type', $series)) {
	                $series['type'] = 'avg';
	            }
	        }
	    }
	    if(!array_key_exists('panels', $t)) {
	        $t['panels'] = array(
	            'title' => 'Four Hours',
	            'start' => '-4 hours',
	            'overview' => true
	        );
	    } else {
	        foreach($t['panels'] as $panel) {
	            if(array_key_exists('series', $panel)) {
	                $panel['series'] = array_merge(array(
        	            're' => '//',
        	            'type' => 'avg'
	                ), $panel['series']);
	            }
	        }
	    }
	    return $t;
	}
	
	public function save($name, $json) {
	    $tpl = $this->getParameter('dir') . DIRECTORY_SEPARATOR . $name . '.json';
	    if(is_readable($tpl) === false) {
	        return 'Error, view not found: ' . $tpl;
	    }
		$old = json_decode(file_get_contents($tpl, true));
		if(is_writable($tpl) !== true) {
		    return 'Error, permission denied: ' . $tpl;
		}
		$new = array_merge($old, json_decode($json, true));
		if(file_put_contents($tpl, json_encode($new), LOCK_EX) === false) {
		    return 'Error, unknown: ' . $tpl;
		}
		return true;
	}
	
	protected function mergeTemplate($a, $b) {
	    $c = array_merge(array(), $a, $b);
	    if(array_key_exists('flot', $a) && array_key_exists('flot', $b)) {
	        $c['flot'] = array_merge_recursive(array(),
	                                           $a['flot'], $b['flot']);
	    }
	    return $c;
	}
	
	public function getTemplate($service) {
		$serviceTemplate = array();
		
		$l = null;
		
		foreach($this->getParameter('templates') as $name => $template) {
			if(preg_match($template['re'], $service)) {
			    $l = $name;
				$serviceTemplate = $this->mergeTemplate($serviceTemplate,
				                                        $template);
			}
		}
		
		$serviceTemplate = $this->mergeTemplate(
		    $this->getParameter('defaultContent'), $serviceTemplate);

		return array(
		    'name' => $l,
		    'content' => $this->validateTemplate($serviceTemplate)
	    );
	}
}