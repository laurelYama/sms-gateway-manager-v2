'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Lock, User as UserIcon, Phone, Mail, RotateCw, Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
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
          title: 'Error',
          description: error instanceof Error ? error.message : 'No se pudo cargar el perfil del usuario',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, toast, refreshUserData]);

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 12) {
      return { valid: false, message: 'La contraseña debe contener al menos 12 caracteres' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'La contraseña debe contener al menos una letra minúscula' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'La contraseña debe contener al menos una letra mayúscula' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'La contraseña debe contener al menos un dígito' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'La contraseña debe contener al menos un carácter especial (por ejemplo: !@#$%^&*)' };
    }
    return { valid: true, message: '' };
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      return;
    }
    
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      setShowPasswordRequirements(true);
      toast({
        title: 'Error',
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
        'Su contraseña ha sido actualizada correctamente.\n\n' +
        'Por razones de seguridad, será desconectado y redirigido a la página de inicio de sesión.\n' +
        'Por favor, inicie sesión nuevamente con su nueva contraseña.\n\n' +
        'Haga clic en Aceptar para continuar.'
      );
      
      if (confirmRedirect) {
        toast({
          title: 'Cerrando sesión...',
          description: 'Será redirigido a la página de inicio de sesión.',
        });
        
        // Déconnexion et redirection après un court délai
        setTimeout(() => {
          logout();
          router.push('/login');
        }, 1000);
      }
      
    } catch (error: unknown) {
      console.error('Error changing password:', error);

      // Narrow unknown error into a shaped object we can inspect without using `any`
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      } | undefined;

      let errorMessage = 'Se produjo un error al modificar la contraseña';
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (typeof err?.message === 'string') {
        errorMessage = err.message;
      }

      if (err?.response?.status === 400) {
        setShowPasswordRequirements(true);
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <Loading className="h-64" text="Cargando su perfil..." />;
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se pudo cargar el perfil del usuario</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          <RotateCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Administre tu información personal y contraseña
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <UserIcon className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="h-4 w-4 mr-2" />
            Contraseña
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información personal</CardTitle>
              <CardDescription>
                Esta información se utiliza para identificarte en la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input 
                    id="lastName" 
                    value={profile.nomManager} 
                    disabled 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input 
                    id="firstName" 
                    value={profile.prenomManager} 
                    disabled 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
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
                  <Label htmlFor="phone">Teléfono</Label>
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
                <Label>Rol</Label>
                <div className="flex items-center p-2 bg-gray-50 rounded-md border">
                  <span className="capitalize">
                    {profile.role === 'SUPER_ADMIN' 
                      ? 'Super Administrador' 
                      : profile.role.toLowerCase().replace('_', ' ')
                    }
                  </span>
                  <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
                    profile.statutCompte === 'ACTIF' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile.statutCompte === 'ACTIF' ? 'Activo' : 'Inactivo'}
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
                <CardTitle>Cambiar contraseña</CardTitle>
                <div className="relative group">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs font-medium">
                    ?
                  </span>
                  <div className="absolute z-10 hidden group-hover:block w-64 p-2 mt-2 text-xs text-gray-600 bg-white border border-gray-200 rounded-md shadow-lg">
                    Por razones de seguridad, se cerrará la sesión después de cambiar la contraseña.
                    Deberás iniciar sesión nuevamente con tu nueva contraseña.
                  </div>
                </div>
              </div>
              {showPasswordRequirements && (
                <CardDescription className="space-y-2">
                  <div className="rounded-md border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <p className="font-medium">La contraseña no cumple con los requisitos:</p>
                    </div>
                    <ul className="mt-2 ml-6 list-disc text-sm text-red-600">
                      <li>Al menos 8 caracteres</li>
                      <li>Al menos una mayúscula</li>
                      <li>Al menos un número</li>
                      <li>Al menos un carácter especial</li>
                    </ul>
                  </div>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="sr-only">
                        {showCurrentPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      </span>
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="sr-only">
                        {showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      </span>
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="sr-only">
                        {showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      </span>
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar nueva contraseña
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
