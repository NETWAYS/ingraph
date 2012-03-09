<?php

class inGraph_Provider_PlotsSuccessView extends inGraphBaseView
{
    public function executeJson(AgaviRequestDataHolder $rd)
    {
        $plots = $this->getAttribute('plots');
        return json_encode(array(
            'total' => count($plots),
            'plots' => $plots
        ));
    }
}
