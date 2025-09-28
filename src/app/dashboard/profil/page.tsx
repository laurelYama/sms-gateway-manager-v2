'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Lock, User as UserIcon, Phone, Mail, ReloadIcon, Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import { userService, type UserProfile } from '@/services/userService';
import { useAuth } from '@/lib/auth';

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUserData, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        // Si l'utilisateur n'est pas chargé, on essaie de rafraîchir les données
        await refreshUserData();
        return;
      }
      
      try {
        setLoading(true);
        const userProfile = await userService.getUserProfile(user.id);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Erreur',
          description: error instanceof Error ? error.message : 'Impossible de charger le profil utilisateur',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, toast]);

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 12) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins 12 caractères' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins une lettre minuscule' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins une lettre majuscule' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins un caractère spécial (ex: !@#$%^&*)' };
    }
    return { valid: true, message: '' };
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
        variant: 'destructive',
      });
      return;
    }
    
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      setShowPasswordRequirements(true);
      toast({
        title: 'Erreur',
        description: passwordValidation.message,
        variant: 'destructive',
      });
      return;
    }
    
    if (!user?.id) return;
    
    try {
      setSaving(true);
      
      await userService.changePassword(user.id, {
        oldPassword: currentPassword,
        newPassword: newPassword
      });
      
      const confirmRedirect = window.confirm(
        'Votre mot de passe a été mis à jour avec succès.\n\n' +
        'Pour des raisons de sécurité, vous allez être déconnecté et redirigé vers la page de connexion.\n' +
        'Veuillez vous reconnecter avec votre nouveau mot de passe.\n\n' +
        'Cliquez sur OK pour continuer.'
      );
      
      if (confirmRedirect) {
        toast({
          title: 'Déconnexion en cours...',
          description: 'Vous allez être redirigé vers la page de connexion.',
        });
        
        // Déconnexion et redirection après un court délai
        setTimeout(() => {
          logout();
          router.push('/login');
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Une erreur est survenue lors de la modification du mot de passe';
      
      if (error.response?.status === 400) {
        setShowPasswordRequirements(true);
      }
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <Loading className="h-64" text="Chargement de votre profil..." />;
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Impossible de charger le profil utilisateur</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          <ReloadIcon className="mr-2 h-4 w-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mon Profil</h1>
          <p className="text-muted-foreground">
            Gérez vos informations personnelles et votre mot de passe
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <UserIcon className="h-4 w-4 mr-2" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="h-4 w-4 mr-2" />
            Mot de passe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Ces informations sont utilisées pour vous identifier sur la plateforme.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input 
                    id="lastName" 
                    value={profile.nomManager} 
                    disabled 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input 
                    id="firstName" 
                    value={profile.prenomManager} 
                    disabled 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                      <Mail className="h-4 w-4" />
                    </span>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profile.email} 
                      className="rounded-l-none"
                      disabled 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                      <Phone className="h-4 w-4" />
                    </span>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={profile.numeroTelephoneManager} 
                      className="rounded-l-none"
                      disabled
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Rôle</Label>
                <div className="flex items-center p-2 bg-gray-50 rounded-md border">
                  <span className="capitalize">{profile.role.toLowerCase().replace('_', ' ')}</span>
                  <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
                    profile.statutCompte === 'ACTIF' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile.statutCompte === 'ACTIF' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Changer le mot de passe</CardTitle>
                <div className="relative group">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs font-medium">
                    ?
                  </span>
                  <div className="absolute z-10 hidden group-hover:block w-64 p-2 mt-2 text-xs text-gray-600 bg-white border border-gray-200 rounded-md shadow-lg">
                    Pour des raisons de sécurité, vous serez déconnecté après avoir changé votre mot de passe.
                    Vous devrez vous reconnecter avec votre nouveau mot de passe.
                  </div>
                </div>
              </div>
              {showPasswordRequirements && (
                <CardDescription className="space-y-2">
                  <div className="rounded-md border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium">Exigences du mot de passe :</div>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          <li>12 caractères minimum</li>
                          <li>Une lettre majuscule</li>
                          <li>Une lettre minuscule</li>
                          <li>Un chiffre</li>
                          <li>Un caractère spécial (!@#$%^&*)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
