export default function Header() {
  return (
    <header className="bg-forest-green text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🚜</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">AI Krishi Mechanic</h1>
              <p className="text-sm md:text-base text-green-100">
                Smart Agricultural Machinery Diagnosis
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-2 bg-green-800 px-4 py-2 rounded-lg">
            <span className="text-2xl">🛡️</span>
            <span className="text-sm font-medium">Safety First</span>
          </div>
        </div>
      </div>
    </header>
  )
}
