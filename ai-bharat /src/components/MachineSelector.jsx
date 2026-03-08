const machines = [
  { id: 'irrigation_pump', name: 'Water Pump', icon: '💧', description: 'Irrigation & Water Pumps' },
  { id: 'tiller', name: 'Tiller', icon: '🔧', description: 'Tillers & Cultivators' },
  { id: 'motor_equipment', name: 'Motor Equipment', icon: '⚙️', description: 'Motor-Driven Tools' },
]

export default function MachineSelector({ selectedMachine, onSelectMachine }) {
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Select Your Machine Type
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {machines.map((machine) => (
          <button
            key={machine.id}
            onClick={() => onSelectMachine(machine.id)}
            className={`p-6 rounded-xl border-2 transition-all duration-200 ${
              selectedMachine === machine.id
                ? 'border-forest-green bg-green-50 shadow-md'
                : 'border-gray-200 hover:border-forest-green hover:bg-gray-50'
            }`}
          >
            <div className="text-5xl mb-3">{machine.icon}</div>
            <h3 className="font-bold text-lg text-gray-800 mb-1">
              {machine.name}
            </h3>
            <p className="text-sm text-gray-600">{machine.description}</p>
            
            {selectedMachine === machine.id && (
              <div className="mt-3 flex items-center justify-center text-forest-green font-medium text-sm">
                <span className="mr-1">✓</span> Selected
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
