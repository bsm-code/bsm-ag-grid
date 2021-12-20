<?php

namespace AgGridBundle;

use Symfony\Component\HttpKernel\Bundle\Bundle;

class BsAgGridBundle extends Bundle
{
    public function getPath(): string
    {
        return \dirname(__DIR__);
    }
}
