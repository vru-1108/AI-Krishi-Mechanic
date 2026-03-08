import { useState } from 'react'
import VoiceRecorder from './VoiceRecorder'

export default function SymptomInput({ onDiagnose, isLoading }) {
  const [symptom, setSymptom] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const handleTranscriptReceived = (transcript) => {
    setSymptom(transcript)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (symptom.trim()) {
      onDiagnose(symptom, imageFile)
    }
  }

  const handleClearImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Describe the Problem
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Text Input with Voice */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="symptom" className="block text-sm font-medium text-gray-700">
              What issue are you experiencing?
            </label>
            <VoiceRecorder onTranscriptReceived={handleTranscriptReceived} />
          </div>
          <textarea
            id="symptom"
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            placeholder="Example: My pump is making a grinding noise after cleaning... Or click 'Start Recording' to speak"
            rows="4"
            className="input-field resize-none text-lg"
            disabled={isLoading}
            required
          />
          <p className="mt-2 text-sm text-gray-500">
            💡 Tip: Type or speak to describe when it started, what sounds you hear, and any recent changes
          </p>
        </div>

        {/* Image Upload (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Photo (Optional)
          </label>
          
          {!imagePreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-forest-green transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
                disabled={isLoading}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <span className="text-4xl mb-2">📷</span>
                <span className="text-sm text-gray-600">
                  Click to upload a photo of the issue
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  (Helps improve diagnosis accuracy)
                </span>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Uploaded issue"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                disabled={isLoading}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !symptom.trim()}
          className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin mr-2">⏳</span>
              Analyzing...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <span className="mr-2">🔍</span>
              Diagnose Issue
            </span>
          )}
        </button>
      </form>
    </div>
  )
}
