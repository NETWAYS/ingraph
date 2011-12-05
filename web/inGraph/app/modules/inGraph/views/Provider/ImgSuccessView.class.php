<?php

class inGraph_Provider_ImgSuccessView extends inGraphBaseView
{
	public function executeImage(AgaviRequestDataHolder $rd)
    {
        $params = $this->getAttribute('params');

        $node = NodeJs::getInstance();
        
        $res = $node->renderImage($params);

        return $res;
	}
}
