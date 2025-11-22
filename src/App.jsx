import { useState } from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white p-4 shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Smart Pet Feeder</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Login
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Feed Your Pet Remotely
          </h2>
          <p className="text-gray-600 text-lg">
            Monitor and control your pet's feeding schedule from anywhere
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold text-lg mb-2">Precise Portions</h3>
            <p className="text-gray-600">Accurate food measurement with load cell sensor</p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold text-lg mb-2">Remote Control</h3>
            <p className="text-gray-600">Control feeding from your phone or computer</p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold text-lg mb-2">Feeding History</h3>
            <p className="text-gray-600">Track your pet's feeding patterns over time</p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold text-lg mb-2">Multiple Users</h3>
            <p className="text-gray-600">Share access with family members</p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold text-lg mb-2">Works Offline</h3>
            <p className="text-gray-600">Device works even without internet</p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-bold text-lg mb-2">Notifications</h3>
            <p className="text-gray-600">Get alerts for feeding and low food</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white mt-12 p-6 text-center border-t">
        <p className="text-gray-600">
          FYP Project - Herald College | Adarsha Prasai (2408599)
        </p>
      </div>
    </div>
  )
}

export default App
