<?php

class inGraph_Provider_ImgErrorView extends inGraphBaseView
{
    public function executeImage(AgaviRequestDataHolder $rd)
    {
        $response = $this->getContainer()->getResponse();
        $response->setHttpHeader('Content-Type', 'text/html');
    }
}
