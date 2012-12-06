<?php

class inGraph_Provider_ImgSuccessView extends inGraphBaseView
{
	public function executeImage(AgaviRequestDataHolder $rd)
    {
        $params = $this->getAttribute('params');
        $nodeJsConfig = AgaviConfig::get('modules.ingraph.nodejs');
        $node = inGraph_Renderer_NodeJs::getInstance(array(
            'cmd' => $nodeJsConfig['bin'] . ' ' 
                . AgaviConfig::get('core.module_dir') 
                . '/inGraph/lib/nodejs/flot-renderer.js'
        ));
        $image = $node->renderImage($params);
        return $image;
	}
}
