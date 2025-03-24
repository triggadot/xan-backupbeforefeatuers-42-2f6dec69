
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // List of common routes to suggest
  const suggestedRoutes = [
    { path: "/", label: "Home" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/accounts", label: "Accounts" },
    { path: "/new/accounts", label: "New Accounts UI" },
    { path: "/invoices", label: "Invoices" },
    { path: "/purchase-orders", label: "Purchase Orders" },
    { path: "/products", label: "Products" },
    { path: "/sync", label: "Sync" },
    { path: "/sync/dashboard", label: "Sync Dashboard" },
    { path: "/sync/connections", label: "Sync Connections" },
    { path: "/sync/mappings", label: "Sync Mappings" },
    { path: "/sync/logs", label: "Sync Logs" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-6 max-w-md bg-white rounded-lg shadow-md">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold mb-2 text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mb-2">Page not found</p>
        <p className="text-gray-500 mb-6">
          The requested route <code className="bg-gray-200 px-2 py-1 rounded">{location.pathname}</code> does not exist.
        </p>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-900">Suggested Routes:</h2>
          <div className="grid grid-cols-2 gap-2">
            {suggestedRoutes.map(route => (
              <Link 
                key={route.path} 
                to={route.path} 
                className="text-blue-500 hover:text-blue-700 hover:underline py-1"
              >
                {route.label}
              </Link>
            ))}
          </div>
        </div>
        
        <Link to="/" className="inline-block bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600 transition-colors">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
