import EstimateCreate from "@/pages/estimates/EstimateCreate";
import EstimateDetail from "@/pages/estimates/EstimateDetail";
import EstimateEdit from "@/pages/estimates/EstimateEdit";
import EstimatesList from "@/pages/estimates/EstimatesList";
import { RouteObject } from "react-router-dom";

const estimateRoutes: RouteObject[] = [
  {
    path: "/estimates",
    element: <EstimatesList />,
  },
  {
    path: "/estimates/create",
    element: <EstimateCreate />,
  },
  {
    path: "/estimates/:id",
    element: <EstimateDetail />,
  },
  {
    path: "/estimates/:id/edit",
    element: <EstimateEdit />,
  },
];

export default estimateRoutes;
