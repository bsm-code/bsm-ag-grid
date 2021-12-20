<?php
/**
 * Created by PhpStorm.
 * User: TOSHIBA
 * Date: 06/08/2020
 * Time: 03:14
 */

namespace BsCode\AgGridBundle\Interfaces;


use Doctrine\ORM\Query;

/**
 * Interface PaginatorRepositoryInterface
 * @package BsCode\AgGridBundle\Interfaces
 *
 * Use this interface to create your own paginator repository for AgGrid
 */
interface PaginatorRepositoryInterface
{

    /**
     * @param string $search
     * @param array $columns
     * @param array $columnsFilters
     * @param array $sort
     * @param bool $singleScalar
     * @return Query
     */
    public function searchPaginate(string $search, array $columns, array $columnsFilters, array $sort, $singleScalar=false): Query;
}