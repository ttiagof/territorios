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
      className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden
        ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}
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
            className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none transition-colors"
            title="Remover imagem"
          >
            ✕
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 gap-1 text-gray-400 select-none" style={{ minHeight: '7rem' }}>
          <span className="text-2xl">🖼</span>
          <span className="text-xs text-center px-2">Arraste uma imagem ou clique para selecionar</span>
        </div>
      )}
    </div>
  )
}
