import { apiRoutes } from "@/lib/api-routes";

export default function ApiDocPage() {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">API 文档</h1>
      
      <div className="space-y-6">
        {apiRoutes.map((route, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                {route.method}
              </span>
              <code className="text-lg">{route.path}</code>
            </div>
            <p className="text-gray-600">{route.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
