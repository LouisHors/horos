import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          AI Agent Orchestration Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Visual workflow editor for AI agents. Drag, drop, and execute 
          AI-powered workflows with ease.
        </p>
        
        <div className="flex gap-4">
          <Link
            href="/workflow"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Launch Editor →
          </Link>
          <a
            href="https://github.com/LouisHors/horos"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            View on GitHub
          </a>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8">
          {[
            { title: 'Visual Editor', desc: 'Drag-and-drop workflow builder with ReactFlow' },
            { title: 'AI Integration', desc: 'Connect to OpenAI and other LLM providers' },
            { title: 'Real-time Execution', desc: 'Watch your workflows run in real-time' },
          ].map((item) => (
            <div key={item.title} className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
