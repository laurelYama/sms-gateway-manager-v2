'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { documentService } from '@/services/documentService';
import { toast } from 'sonner';

export function DocumentUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadStatus('idle');
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage('Veuillez sélectionner un fichier');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    try {
      const result = await documentService.uploadDocument(file);
      
      toast.success('Document téléversé avec succès', {
        description: `Le fichier ${result.fileName} a été téléversé avec succès.`
      });
      
      setUploadStatus('success');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erreur lors du téléversement:', error);
      const message = error instanceof Error ? error.message : 'Une erreur est survenue lors du téléversement';
      setErrorMessage(message);
      setUploadStatus('error');
      
      toast.error('Erreur lors du téléversement', {
        description: message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Documentation de l'API
        </CardTitle>
        <CardDescription>
          Téléversez la documentation de l'API au format PDF pour l'intégration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="document">Sélectionner un fichier</Label>
            <div className="flex items-center gap-2">
              <Input
                id="document"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
                disabled={isUploading}
                className="cursor-pointer"
              />
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="whitespace-nowrap"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Téléversement...
                  </>
                ) : (
                  'Téléverser'
                )}
              </Button>
            </div>
            
            {file && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(2)} Mo)
                </span>
              </div>
            )}
            
            {uploadStatus === 'success' && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Téléversement réussi !</span>
              </div>
            )}
            
            {errorMessage && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <XCircle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
          
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <p className="font-medium">Format accepté :</p>
            <ul className="mt-1 list-disc pl-5">
              <li>Document : .pdf uniquement</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              Taille maximale : 10 Mo
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
