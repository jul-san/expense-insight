'use client';

import { useRef, useState } from 'react';

interface Props {
  compact: boolean;
  onFiles: (files: File[]) => void;
}

export function UploadZone({ compact, onFiles }: Props) {
  const inputRef    = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      id="uploadZone"
      className={[compact ? 'compact' : '', dragging ? 'drag-over' : ''].join(' ').trim()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setDragging(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="icon">📄</div>
      <h2>Drop your statements here</h2>
      <p>Select one or multiple PDFs — each statement adds to the timeline</p>
      <input
        ref={inputRef}
        type="file"
        id="fileInput"
        accept=".pdf,.txt"
        multiple
        onChange={e => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
      <button className="btn" onClick={() => inputRef.current?.click()}>
        Choose Files
      </button>
    </div>
  );
}
