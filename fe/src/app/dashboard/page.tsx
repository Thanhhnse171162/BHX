'use client'

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="mb-6">
          <svg 
            className="w-24 h-24 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Tính năng đang phát triển
        </h1>
        <p className="text-gray-600 text-lg">
          Dashboard sẽ sớm có sẵn. Vui lòng quay lại sau!
        </p>
      </div>
    </div>
  )
}
