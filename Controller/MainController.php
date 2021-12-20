<?php

namespace AgGridBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Class MainController
 * @package AgGridBundle\Controller
 * @Route("/bs_grid" , name="paginationAgGrid")
 */
class MainController extends Controller
{
    /**
     * @Route("/paginate" , name="paginationAgGrid")
     * @param Request $request
     * @return JsonResponse
     */
    public function paginateAction(Request $request)
    {
        $bundle = $request->request->get('bundle');
        $entity = $request->request->get('entity');
        $rowsNumber = intval($request->request->get('rowsPerPage'));
        $page = intval($request->request->get('pageNumber'));
        $search = $request->request->get('globalSearch');
        $alias =  $request->request->get('alias');
        $filterCols = $request->request->get('globalSearchFileds');
        $columnsFilters = $request->request->get('columns');
        $sort = $request->request->get('sortable');
        $cols = [];

        if($filterCols!= 'none'){
            foreach ($filterCols as $filter){
//                array_push($cols,$filter);
                $cols[] = $filter;
            }
            $parser = $this->get('my_agGrid.pagination');
            $results = $parser->paginate($page,$rowsNumber,$bundle.':'.$entity,$search,$alias,$cols,$columnsFilters,$sort);
            return $this->json([
                'data' => $results["data"],
                'nb' => intval($results["nb"])
            ]);
        }
        else{
            $parser = $this->get('my_agGrid.pagination');
            $data = $parser->paginate($page,$rowsNumber,$bundle.':'.$entity,$search,$alias,null,$columnsFilters,$sort);
            //$em = $this->getDoctrine()->getManager();
            //$data = $em->getRepository($bundle.':'.$entity)->findAll();
            return $this->json([
                'data' => $data['data'],
                'nb' => count($data['data'])
            ]);
        }
    }

    /**
     * @Route("/distinct-column-data", name="load_distinct_column_data")
     * @param Request $request
     * @return JsonResponse
     */
    public function distinctDataForColumn(Request $request){
        $data = json_decode($request->getContent(), true);
        $distinct = $this->get('my_agGrid.pagination')->distinctDataByColumn(
            $data['entity'], $data['bundle'], $data['field'], $data['type']
        );
        return $this->json($distinct);
    }
}
