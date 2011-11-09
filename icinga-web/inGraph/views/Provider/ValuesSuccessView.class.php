<?php

class inGraph_Provider_ValuesSuccessView extends inGraphBaseView {
    public function executeJson(AgaviRequestDataHolder $rd) {
        return json_encode($this->getAttribute('values'));
    }
}