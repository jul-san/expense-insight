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
      <div className="upload-icon-wrap">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="#a78bfa" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 20H17C18.1 20 19 19.1 19 18V9.83C19 9.3 18.79 8.79 18.41 8.41L15.59 5.59C15.21 5.21 14.7 5 14.17 5H7C5.9 5 5 5.9 5 7V18C5 19.1 5.9 20 7 20Z" stroke="#a78bfa" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
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
