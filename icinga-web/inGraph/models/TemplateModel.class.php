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
                AppKitAgaviUtil::log(
                    sprintf($this->tm->_('Template %s not readable. Maybe the JSON format is wrong.'),
                    $template->getRealPath()), AgaviLogger::ERROR);
				continue;
			}
			
			if($template->getFilename() === $this->getParameter('default')) {
				$this->setParameter('defaultContent', $content);
			} else {
				$templates[] = $content;
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
		
		foreach($this->getParameter('templates') as $template) {
			if(preg_match($template['re'], $service)) {
				$serviceTemplate = $this->mergeTemplate($serviceTemplate,
				                                        $template);
			}
		}
		
		$serviceTemplate = $this->mergeTemplate(
		    $this->getParameter('defaultContent'), $serviceTemplate);

		return $this->validateTemplate($serviceTemplate);
	}
}