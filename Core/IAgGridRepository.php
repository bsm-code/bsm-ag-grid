<?php
/**
 * Created by PhpStorm.
 * User: TOSHIBA
 * Date: 23/06/2020
 * Time: 12:06
 */

namespace BsCode\AgGridBundle\Core;


interface IAgGridRepository
{
    public function globalSearch($search, $searchType);
}