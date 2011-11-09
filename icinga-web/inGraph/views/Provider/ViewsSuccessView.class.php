<?php

class inGraph_Provider_ViewsSuccessView extends inGraphBaseView {
	public function executeJson(AgaviRequestDataHolder $rd) {
        $views = $this->getAttribute('views');
        $results = array();
        foreach($views as $view => $config) {
            $results[] = array('view' => $view, 'config' => $config);
        }
        return json_encode(array(
            'results' => $results,
             'total' => count($results)
        ));
	}
}