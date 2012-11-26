<?php

class inGraph_Cronk_ViewArchitectSuccessView extends inGraphBaseView
{
    public function executeHtml(AgaviRequestDataHolder $rd) {
        $this->setupHtml($rd);

        $this->setAttribute('_title', 'Cronk.ViewArchitect');
    }
}
