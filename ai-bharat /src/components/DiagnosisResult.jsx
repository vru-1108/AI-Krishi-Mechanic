const decisionConfig = {
  proceed: {
    color: 'proceed-green',
    bgColor: 'bg-green-50',
    borderColor: 'border-proceed-green',
    icon: '✅',
    title: 'Safe to Proceed',
    description: 'You can follow these steps to fix the issue'
  },
  caution: {
    color: 'caution-yellow',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-caution-yellow',
    icon: '⚠️',
    title: 'Proceed with Caution',
    description: 'Follow these steps carefully and watch for any issues'
  },
  escalate: {
    color: 'safety-red',
    bgColor: 'bg-red-50',
    borderColor: 'border-safety-red',
    icon: '🚫',
    title: 'Professional Help Required',
    description: 'This issue requires a qualified mechanic'
  }
}

export default function DiagnosisResult({ diagnosis }) {
  const config = decisionConfig[diagnosis.decision] || decisionConfig.escalate
  
  return (
    <div className={`card ${config.bgColor} border-2 ${config.borderColor}`}>
      {/* Decision Header */}
      <div className="flex items-start space-x-4 mb-6">
        <div className="text-5xl">{config.icon}</div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {config.title}
          </h2>
          <p className="text-gray-600">{config.description}</p>
          <div className="mt-2 inline-block px-3 py-1 bg-white rounded-full text-sm font-medium">
            Confidence: <span className="capitalize">{diagnosis.confidence}</span>
          </div>
        </div>
      </div>

      {/* Reasoning */}
      {diagnosis.reasoning && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
            <span className="mr-2">💭</span>
            Analysis
          </h3>
          <p className="text-gray-700">{diagnosis.reasoning}</p>
        </div>
      )}

      {/* Safety Warnings */}
      {diagnosis.safety_warnings && diagnosis.safety_warnings.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-3 flex items-center">
            <span className="mr-2">⚠️</span>
            Safety Warnings
          </h3>
          <ul className="space-y-2">
            {diagnosis.safety_warnings.map((warning, index) => (
              <li key={index} className="flex items-start text-red-700">
                <span className="mr-2 mt-1">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Guidance Steps */}
      {diagnosis.guidance && diagnosis.guidance.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <span className="mr-2">📋</span>
            Step-by-Step Guidance
          </h3>
          <ol className="space-y-3">
            {diagnosis.guidance.map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-forest-green text-white rounded-full flex items-center justify-center font-bold mr-3">
                  {index + 1}
                </span>
                <span className="flex-1 pt-1 text-gray-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Escalation Message */}
      {diagnosis.decision === 'escalate' && (
        <div className="p-4 bg-white rounded-lg border-2 border-red-300">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
            <span className="mr-2">👨‍🔧</span>
            Next Steps
          </h3>
          <p className="text-gray-700 mb-3">
            Please contact a qualified mechanic to inspect and repair this issue safely.
          </p>
          <button className="btn-secondary w-full">
            Find Local Mechanics
          </button>
        </div>
      )}

      {/* Additional Help */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          Need more help? <button className="text-forest-green font-medium hover:underline">
            Start New Diagnosis
          </button>
        </p>
      </div>
    </div>
  )
}
