import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { api } from '@/services/api';
import { Download, Loader2, X } from 'lucide-react';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string | null;
  filename: string;
}

export function PDFPreviewModal({ isOpen, onClose, title, pdfUrl, filename }: PDFPreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentObjectUrl: string | null = null;
    let isMounted = true;

    if (isOpen && pdfUrl) {
      const fetchPdf = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await api.get(pdfUrl, { responseType: 'blob' });
          if (isMounted) {
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            currentObjectUrl = url;
            setObjectUrl(url);
          }
        } catch (err: any) {
          if (isMounted) {
            setError('Failed to load PDF document.');
            console.error(err);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      fetchPdf();
    } else {
      setObjectUrl(null);
      setError(null);
    }

    return () => {
      isMounted = false;
      if (currentObjectUrl) {
        window.URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, [isOpen, pdfUrl]);

  const handleDownload = () => {
    if (objectUrl) {
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
    >
      <div className="flex flex-col h-[70vh]">
        <div className="flex-1 bg-surface-muted rounded border border-border flex items-center justify-center overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/50 z-10">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-sm text-text-muted">Generating document...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                <X className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-text mb-1">Preview Error</h3>
              <p className="text-sm text-text-muted">{error}</p>
            </div>
          )}

          {objectUrl && !loading && !error && (
            <iframe
              src={`${objectUrl}#toolbar=0`}
              className="w-full h-full border-0"
              title={title}
            />
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={handleDownload} 
            disabled={!objectUrl || loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
