<?php

class inGraph_Provider_ImgErrorView extends inGraphBaseView {
    public function executeImage(AgaviRequestDataHolder $rd) {
        header('Content-type: text/html');
        echo $this->getAttribute('errorMessage');
        exit;
    }
}
