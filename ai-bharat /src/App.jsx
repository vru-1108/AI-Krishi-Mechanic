import { useState } from 'react'
import Header from './components/Header'
import MachineSelector from './components/MachineSelector'
import SymptomInput from './components/SymptomInput'
import DiagnosisResult from './components/DiagnosisResult'
import { diagnoseMachineIssue } from './services/bedrockService'

function App() {
  const [selectedMachine, setSelectedMachine] = useState('irrigation_pump')
  const [isLoading, setIsLoading] = useState(false)
  const [diagnosis, setDiagnosis] = useState(null)
  const [error, setError] = useState(null)

  const handleDiagnose = async (symptom, imageFile) => {
    setIsLoading(true)
    setError(null)
    setDiagnosis(null)

    try {
      const result = await diagnoseMachineIssue(symptom, selectedMachine, imageFile)
      setDiagnosis(result)
    } catch (err) {
      setError(err.message || 'Failed to diagnose the issue. Please try again.')
      console.error('Diagnosis error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Machine Selection */}
        <section className="mb-8">
          <MachineSelector 
            selectedMachine={selectedMachine}
            onSelectMachine={setSelectedMachine}
          />
        </section>

        {/* Symptom Input */}
        <section className="mb-8">
          <SymptomInput 
            onDiagnose={handleDiagnose}
            isLoading={isLoading}
          />
        </section>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Diagnosis Result */}
        {diagnosis && (
          <section className="mb-8">
            <DiagnosisResult diagnosis={diagnosis} />
          </section>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-forest-green border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Analyzing your machine issue...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-forest-green text-white py-6 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            AI Krishi Mechanic - Supporting farmers with safe, intelligent machinery guidance
          </p>
          <p className="text-xs mt-2 opacity-80">
            Always prioritize safety. Consult a professional mechanic for complex issues.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
