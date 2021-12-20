<?php
/**
 * Created by PhpStorm.
 * User: TOSHIBA
 * Date: 23/06/2020
 * Time: 11:23
 */

namespace BsCode\AgGridBundle\Service;


use Doctrine\ORM\Query;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ObjectManager;

class Paginations
{
    /**
     * @var ObjectManager
     */
    public $em;

    /**
     * Paginations constructor.
     * @param $em
     */
    public function __construct($em)
    {
        $this->em = $em;
    }

    public function paginate($numPage, $rowPerPage, $namespace, $search, $en, $cols,$columnsFilters, $sort)
    {
        /**
         * for better performance instead of doing count($query->getResult())
         * we create the query but with COUNT operator
         *
         * After testing performance for 8463 row we found the following results:
         * count($query->getResult()) => execution time: 4322ms
         * $query->getSingleScalarResult() => execution time: 994ms
         */
        $singleScalarQuery = $this->searchPaginate($namespace,$search,$en, $cols, $columnsFilters, $sort, true);
        //$nb = count ($singleScalarQuery->getResult());
        $nb = $singleScalarQuery->getSingleScalarResult();

        // create the same query for data
        $query = $this->searchPaginate($namespace,$search,$en, $cols, $columnsFilters, $sort);
        $query
            ->setFirstResult(($numPage-1)*$rowPerPage)
            ->setMaxResults($rowPerPage)
        ;

        return ['data'=> $query->getResult(), "nb" => $nb];
    }

    private function isfieldExited($array,$field): bool {
        foreach ($array as $item){
            if($item['field'] == $field) { return true; }
        }
        return false;
    }

    /**
     * Build query based on the given data
     *
     * @param string $namespace namespace of the entity
     * @param string $search piece of string the we will search in the field base on it
     * @param string $entity class type of the target entity
     * @param array $columns
     * @param array $columnsFilters
     * @param array $sort
     * @param bool $singleScalar true if you want to create a query but for count row
     * @return Query
     */
    public function searchPaginate($namespace, $search, $entity, $columns, $columnsFilters, $sort, $singleScalar = false){
            $alias = strtolower($entity);
            /** @var QueryBuilder $qb */
            $qb = $this->em->createQueryBuilder($alias);
            if($singleScalar){
                $qb
                    ->select('COUNT('.$alias.')')
                    ->from($namespace,$alias)
                ;
            }else{
                $qb
                    ->select($alias)
                    ->from($namespace,$alias)
                ;
            }

            $i=0;
            if($columns!= null){
                if(count($columns)>0){
                    /**  Join columns configutration after Where condition */
                    foreach ($columns as $column){
                        if($column['type'] == 'entity'){
                            $list = explode(".", $column['field']);
                            $ent = $list[0];
                            $field = $list[1];
                            $qb->leftJoin($alias.'.'.$ent,strtolower($ent));
                        }
                    }
                    if($columnsFilters['empty']=='false'){
                        foreach ($columnsFilters['data'] as $colFilter){
                            if($colFilter['type'] == 'entity') {
                                if(!$this->isfieldExited($columns,$colFilter['field'])){
                                    $list = explode(".", $colFilter['field']);
                                    $ent = $list[0];
                                    $qb->leftJoin($alias.'.'.$ent,strtolower($ent));
                                }
                            }
                        }
                    }
                    /**
                     * global research configuration
                     */
                    foreach ($columns as $col){
                        $i++;
                        /**
                         * if the data type is string
                         */
                        if($col['type'] == 'string' || ($col['type'] != 'entity' && $col['type'] != null)){
                            if($i == 1){
                                $qb->Where( $qb->expr()->like($alias.'.'.$col['field'], ':reg'));
                            }else{
                                $qb->orWhere( $qb->expr()->like($alias.'.'.$col['field'], ':reg'));
                            }
                        }else{
                            /**
                             * if the data type is entity type
                             */
                            if($col['type'] == 'entity'){
                                $list = explode(".", $col['field']);
                                $ent = strtolower($list[0]);
                                $field = $list[1];
                                if($i == 1){
                                    $qb->Where( $qb->expr()->like($ent.'.'.$field, ':reg'));
                                }else{
                                    $qb->orWhere( $qb->expr()->like($ent.'.'.$field, ':reg'));
                                }
                            }
                            // is not a string value searched [number( int , double, float), entity]
                        }
                    }
                    /**
                     * column filter configuration
                     */
                    if($columnsFilters['empty']=='false'){
                        foreach ($columnsFilters['data'] as $colFilter){
                            /**
                             * if the column type is string
                             */
                            if($colFilter['type'] == 'string') {
                                    //$qb->setParameter('discr', $discr);
                                    if ($i == 0) {
                                        if(in_array("null", $colFilter['data'])){
                                            $ind = array_search('null', $colFilter['data']);
                                            unset($colFilter['data'][$ind]);
                                            if(count($colFilter['data']) >0){
                                                $qb->Where( $qb->expr()->orX(
                                                    $qb->expr()->in($entity.'.'.$colFilter['field'], $colFilter['data']),
                                                    $qb->expr()->isNull($entity.'.'.$colFilter['field'])
                                                ));
                                            }else{
                                                $qb->Where(
                                                    $qb->expr()->isNull($entity.'.'.$colFilter['field'])
                                                );
                                            }
                                        }else{
                                            $qb->Where(
                                                $qb->expr()->in($entity.'.'.$colFilter['field'], $colFilter['data'])
                                            );
                                        }
                                        //$qb->Where($alias.' INSTANCE OF '.$dataField);  //$qb->expr()->isInstanceOf($alias, $dataField)

                                    } else {
                                        if(in_array("null", $colFilter['data'])){
                                            $ind = array_search('null', $colFilter['data']);
                                            unset($colFilter['data'][$ind]);
                                            if(count($colFilter['data']) > 0){
                                                $qb->andWhere( $qb->expr()->orX(
                                                    $qb->expr()->in($entity.'.'.$colFilter['field'], $colFilter['data']),
                                                    $qb->expr()->isNull($entity.'.'.$colFilter['field'])
                                                ));
                                            }else{
                                                $qb->andWhere(
                                                    $qb->expr()->isNull($entity.'.'.$colFilter['field'])
                                                );
                                            }
                                        }else {
                                            //$qb->orWhere($alias.' INSTANCE OF '.$dataField); //$qb->expr()->isInstanceOf($alias, $dataField));
                                            $qb->andWhere($qb->expr()->in($entity . '.' . $colFilter['field'], $colFilter['data']));
                                        }
                                    }
                            }else{
                                /**
                                 * if the column type is date
                                 */
                                if($colFilter['type'] == 'date'){
                                    if( $i == 0){
                                        $qb->Where( $qb->expr()->in("DATE_FORMAT(".$entity.".".$colFilter['field'].", '%Y-%m-%d')", $colFilter['data']));
                                    }else{
                                        $qb->andWhere( $qb->expr()->in("DATE_FORMAT(".$entity.".".$colFilter['field'].", '%Y-%m-%d')", $colFilter['data']));
                                    }
                                }else{
                                    /**
                                     * if the column type is boolean
                                     */
                                    if($colFilter['type'] == 'boolean'){
                                        if(array_key_exists("data",$colFilter)){
                                            $booleansData = [];
                                            $isNull = false;
                                            foreach ($colFilter['data'] as $c){
                                                if (intval($c) === 0) {
                                                    $isNull = true;
                                                    array_push($booleansData, false);
                                                } else {
                                                    array_push($booleansData, true);
                                                }
                                            }
                                            if( $i == 0 ){
                                                if($isNull == true){
                                                    if(count($booleansData) > 0){
                                                        $qb->Where( $qb->expr()->orX(
                                                            $qb->expr()->in($entity.'.'.$colFilter['field'],$booleansData),
                                                            $qb->expr()->isNull($entity.'.'.$colFilter['field'])
                                                        ));
                                                    }else{
                                                        $qb->Where(
                                                            $qb->expr()->isNull($entity.'.'.$colFilter['field'])
                                                        );
                                                    }
                                                }else{
                                                    $qb->Where(
                                                        $qb->expr()->in($entity.'.'.$colFilter['field'],$booleansData
                                                    ));
                                                }
                                            }
                                            else{
                                                if($isNull == true){
                                                    if(count($booleansData) > 0) {
                                                        $qb->andWhere($qb->expr()->orX(
                                                            $qb->expr()->in($entity . '.' . $colFilter['field'], $booleansData),
                                                            $qb->expr()->isNull($entity . '.' . $colFilter['field'])
                                                        ));
                                                    }else{
                                                        $qb->andWhere(
                                                            $qb->expr()->isNull($entity . '.' . $colFilter['field'])
                                                        );
                                                    }
                                                }else{
                                                    $qb->andWhere(
                                                        $qb->expr()->in($entity.'.'.$colFilter['field'],$booleansData)
                                                    );
                                                }
                                            }
                                        }
                                    }else{
                                        /**
                                         * if the column type is entity
                                         */
                                        if($colFilter['type'] == 'entity'){
                                            $list = explode(".", $colFilter['field']);
                                            $ent = strtolower($list[0]);
                                            $field = $list[1];
                                            if($i == 1){
                                                $qb->Where( $qb->expr()->in($ent.'.'.$field,$colFilter['data']));
                                            }else{
                                                $qb->andWhere( $qb->expr()->in($ent.'.'.$field, $colFilter['data']));
                                            }
                                        }else{
                                            if($colFilter['type'] == 'nullable'){
                                                $nullable = $colFilter['data'][0];
                                                if( $i == 0 ){
                                                    if($nullable == '1'){
                                                        $qb->Where( $qb->expr()->isNotNull($entity.'.'.$colFilter['field']));
                                                    }else{
                                                        $qb->Where( $qb->expr()->isNull($entity.'.'.$colFilter['field']));
                                                    }
                                                }else{
                                                    if($nullable == '1') {
                                                        $qb->andWhere($qb->expr()->isNotNull($entity . '.' . $colFilter['field']));
                                                    }else {
                                                        $qb->andWhere($qb->expr()->isNull($entity . '.' . $colFilter['field']));
                                                    }
                                                }
                                            }
                                            else{
                                                if($colFilter['type'] == 'number'){
                                                    $numData = $colFilter['data'][0];
                                                    $filterType = $numData['filter'];
                                                    $value = $numData['value'];
                                                    if( $i == 0 ){
                                                        if($filterType == 'ir'){
                                                            $from = floatval($value['from']);
                                                            $to = floatval($value['to']);
                                                            $qb->Where(
                                                                $qb->expr()->andX(
                                                                    $qb->expr()->lte($entity.'.'.$colFilter['field'],$to),
                                                                    $qb->expr()->gte($entity.'.'.$colFilter['field'], $from)
                                                                )
                                                            );
                                                        }else{
                                                            $valData = floatval($value);
                                                            if($filterType == 'eq'){
                                                                $qb->Where( $qb->expr()->eq($entity.'.'.$colFilter['field'],$valData));
                                                            }
                                                            else{
                                                                if($filterType == 'neq'){
                                                                    $qb->Where( $qb->expr()->neq($entity.'.'.$colFilter['field'],$valData));
                                                                }else{
                                                                    if($filterType == 'lt'){
                                                                        $qb->Where( $qb->expr()->lt($entity.'.'.$colFilter['field'],$valData));
                                                                    }else{
                                                                        if($filterType == 'lte'){
                                                                            $qb->Where( $qb->expr()->lte($entity.'.'.$colFilter['field'],$valData));
                                                                        }else{
                                                                            if($filterType == 'gt'){
                                                                                $qb->Where( $qb->expr()->gt($entity.'.'.$colFilter['field'],$valData));
                                                                            }else{
                                                                                if($filterType == 'gte'){
                                                                                    $qb->Where( $qb->expr()->gte($entity.'.'.$colFilter['field'],$valData));
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }else{
                                                        if($filterType == 'ir'){
                                                            $from = floatval($value['from']);
                                                            $to = floatval($value['to']);
                                                            $qb->andWhere(
                                                                $qb->expr()->andX(
                                                                    $qb->expr()->lte($entity.'.'.$colFilter['field'],$to),
                                                                    $qb->expr()->gte($entity.'.'.$colFilter['field'], $from)
                                                                )
                                                            );
                                                        }else{
                                                            $valData = floatval($value);
                                                            if($filterType == 'eq'){
                                                                $qb->andWhere( $qb->expr()->eq($entity.'.'.$colFilter['field'],$valData));
                                                            }
                                                            else{
                                                                if($filterType == 'neq'){
                                                                    $qb->andWhere( $qb->expr()->neq($entity.'.'.$colFilter['field'],$valData));
                                                                }
                                                                else{
                                                                    if($filterType == 'lt'){
                                                                        $qb->andWhere( $qb->expr()->lt($entity.'.'.$colFilter['field'],$valData));
                                                                    }else{
                                                                        if($filterType == 'lte'){
                                                                            $qb->andWhere( $qb->expr()->lte($entity.'.'.$colFilter['field'],$valData));
                                                                        }else{
                                                                            if($filterType == 'gt'){
                                                                                $qb->andWhere( $qb->expr()->gt($entity.'.'.$colFilter['field'],$valData));
                                                                            }else{
                                                                                if($filterType == 'gte'){
                                                                                    $qb->andWhere( $qb->expr()->gte($entity.'.'.$colFilter['field'],$valData));
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    $qb->setParameter('reg', '%'.$search.'%');
                }
            }

            if(strpos($sort['field'],'.') !== false){
                $listSort = explode(".", $sort['field']);
                $entSort = strtolower($listSort[0]);
                $sortField = $listSort[1];
                if(!$this->isfieldExited($columns,$sort['field'])){
                    $qb->leftJoin($alias.'.'.$entSort,strtolower($entSort));
                }
                $qb->orderBy($entSort.".".$sortField, strtoupper($sort['sort']));
            }else{
                $qb->orderBy($alias.".".$sort['field'], strtoupper($sort['sort']));
            }

        return $qb->getQuery();
    }

    public function distinctDataByColumn($entity, $bundle, $field, $type)
    {
        $alias = strtolower($entity);
        /** @var QueryBuilder $qb */
        $qb = $this->em->createQueryBuilder($alias);
        /*$qb
            ->from($bundle . ':' . $entity, $alias)
            ->select('DATE(' . $alias . '.'. $field .') as ' . $field)
            ->orderBy($alias . '.'. $field, 'DESC')
            ->distinct()
        ;*/
        if($type == 'entity' ) {
            $parentField = explode(".", $field)[0];
            $childField = explode(".", $field)[1];
            $qb->select($parentField.".".$childField)
                ->from($bundle . ':' . $entity, $alias)
                ->leftJoin($alias.'.'.$parentField,$parentField)
                ->orderBy($parentField . '.'. $childField, 'DESC')
                ->distinct();
        }else{
            if($type == 'date'){
                $qb->select('DATE(' . $alias . '.'. $field .') as ' . $field)
                    ->from($bundle . ':' . $entity, $alias)
                    ->where($qb->expr()->isNotNull($alias . '.'. $field))
                    ->orderBy($alias . '.'. $field, 'DESC')
                    ->distinct();
            }else{
                $qb->select($alias . '.'. $field .' as ' . $field)
                    ->from($bundle . ':' . $entity, $alias)
                    ->where($qb->expr()->isNotNull($alias . '.'. $field))
                    ->orderBy($alias . '.'. $field, 'DESC')
                    ->distinct();
            }
        }
         /*$qb->select('DATE(' . $alias . '.'. $field .') as ' . $field);
        else $qb->select($alias . '.'. $field .' as ' . $field);*/

        return $qb->getQuery()->getArrayResult();

    }

    private function guessAlias($entity){
        return substr(strtolower($entity), 0, 1);
    }
}