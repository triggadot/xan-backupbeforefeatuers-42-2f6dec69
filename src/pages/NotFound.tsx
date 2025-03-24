import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

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
    { path: "/sync", label: "Sync" },
    { path: "/sync/dashboard", label: "Sync Dashboard" },
    { path: "/sync/connections", label: "Sync Connections" },
    { path: "/sync/mappings", label: "Sync Mappings" },
    { path: "/sync/logs", label: "Sync Logs" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-6 max-w-md">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-2">Oops! Page not found</p>
        <p className="text-gray-500 mb-4">
          The requested route <code className="bg-gray-200 px-2 py-1 rounded">{location.pathname}</code> does not exist.
        </p>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Suggested Routes:</h2>
          <ul className="space-y-1">
            {suggestedRoutes.map(route => (
              <li key={route.path}>
                <Link 
                  to={route.path} 
                  className="text-blue-500 hover:text-blue-700 underline"
                >
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <Link to="/" className="inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
