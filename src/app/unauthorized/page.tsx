'use client';

import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800">Accès refusé</h1>
        
        <p className="text-gray-600">
          Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
          Veuillez contacter votre administrateur si vous pensez qu'il s'agit d'une erreur.
        </p>
        
        <div className="pt-4">
          <Button 
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 bg-[#0072BB] hover:bg-[#005b96]"
          >
            <Home className="h-4 w-4" />
            Retour à la page de connexion
          </Button>
        </div>
      </div>
    </div>
  );
}
