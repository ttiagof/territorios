import { useState, useRef } from 'react'

export default function ImageDropZone({ preview, onFile, onClear }) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) onFile(file)
  }

  return (
    <div
      className={`relative rounded-xl cursor-pointer overflow-hidden transition-colors ${
        dragActive ? 'bg-gray-200 dark:bg-gray-700' : 'bg-[#f0f0f0] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
      style={{ minHeight: '7rem' }}
      onDragOver={e => { e.preventDefault(); setDragActive(true) }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files[0]; if (f) onFile(f) }}
      />
      {preview ? (
        <>
          <img src={preview} alt="preview" className="w-full object-cover" style={{ minHeight: '7rem', maxHeight: '10rem' }} />
          <button
            onClick={e => { e.stopPropagation(); onClear() }}
            className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs leading-none transition-colors"
            title="Remover imagem"
          >
            ✕
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 gap-2 text-gray-400 select-none" style={{ minHeight: '7rem' }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          <span className="text-xs text-center px-2 leading-snug">Arraste ou clique para selecionar</span>
        </div>
      )}
    </div>
  )
}
